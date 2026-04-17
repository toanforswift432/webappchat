using ChatApp.Application.Interfaces;
using Microsoft.Extensions.Configuration;
using Minio;
using Minio.DataModel.Args;

namespace ChatApp.Infrastructure.Storage;

public class MinioStorageService(IMinioClient minio, IConfiguration config) : IStorageService
{
    private readonly string _bucket = config["Minio:Bucket"] ?? "chatapp";
    private readonly string _endpoint = config["Minio:Endpoint"] ?? "localhost:9000";

    public async Task<string> UploadAsync(Stream fileStream, string fileName, string contentType, CancellationToken ct = default)
    {
        var objectName = $"{Guid.NewGuid()}_{fileName}";

        var bucketExistsArgs = new BucketExistsArgs().WithBucket(_bucket);
        var exists = await minio.BucketExistsAsync(bucketExistsArgs, ct);
        if (!exists)
        {
            var makeBucketArgs = new MakeBucketArgs().WithBucket(_bucket);
            await minio.MakeBucketAsync(makeBucketArgs, ct);
        }

        var putObjectArgs = new PutObjectArgs()
            .WithBucket(_bucket)
            .WithObject(objectName)
            .WithStreamData(fileStream)
            .WithObjectSize(fileStream.Length)
            .WithContentType(contentType);

        await minio.PutObjectAsync(putObjectArgs, ct);
        return objectName;
    }

    public async Task DeleteAsync(string objectName, CancellationToken ct = default)
    {
        var args = new RemoveObjectArgs().WithBucket(_bucket).WithObject(objectName);
        await minio.RemoveObjectAsync(args, ct);
    }

    public string GetPublicUrl(string objectName)
        => $"http://{_endpoint}/{_bucket}/{objectName}";
}
