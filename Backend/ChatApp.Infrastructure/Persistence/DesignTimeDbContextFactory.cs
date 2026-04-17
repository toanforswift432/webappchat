using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace ChatApp.Infrastructure.Persistence;

public class DesignTimeDbContextFactory : IDesignTimeDbContextFactory<AppDbContext>
{
    public AppDbContext CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<AppDbContext>();
        optionsBuilder.UseSqlServer(
            "Data Source=118.69.76.228,57914;Initial Catalog=ChatApp;User ID=dev-swift;Password=(dk&qDPHXm-F]0%$;MultipleActiveResultSets=True;TrustServerCertificate=True");
        return new AppDbContext(optionsBuilder.Options);
    }
}
