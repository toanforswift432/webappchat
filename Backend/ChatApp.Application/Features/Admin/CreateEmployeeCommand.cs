using ChatApp.Application.Common;
using ChatApp.Application.Interfaces;
using ChatApp.Domain.Entities;
using ChatApp.Domain.Enums;
using MediatR;

namespace ChatApp.Application.Features.Admin;

public record CreateEmployeeCommand(
    string Email,
    string DisplayName,
    string? PhoneNumber,
    string? Department = null) : IRequest<Result<CreateEmployeeResponseDto>>;

public record CreateEmployeeResponseDto(string Message, Guid EmployeeId);

public class CreateEmployeeCommandHandler(
    IUserRepository users,
    IEmailService email,
    IUnitOfWork uow)
    : IRequestHandler<CreateEmployeeCommand, Result<CreateEmployeeResponseDto>>
{
    public async Task<Result<CreateEmployeeResponseDto>> Handle(CreateEmployeeCommand request, CancellationToken ct)
    {
        // Validate
        if (await users.GetByEmailAsync(request.Email, ct) is not null)
            return Result<CreateEmployeeResponseDto>.Failure("Email already in use.");

        if (!string.IsNullOrEmpty(request.PhoneNumber))
        {
            if (await users.GetByPhoneAsync(request.PhoneNumber, ct) is not null)
                return Result<CreateEmployeeResponseDto>.Failure("Phone number already in use.");
        }

        // Tạo employee account (không có password, auto-approved, chờ verify)
        var employee = User.CreateEmployeeWithoutPassword(request.Email, request.DisplayName, request.PhoneNumber);

        // Generate OTP và Verification Token
        var otp = GenerateOtp();
        var token = Guid.NewGuid().ToString();
        var expiresAt = DateTime.UtcNow.AddHours(1);

        employee.SetOtp(otp, DateTime.UtcNow.AddMinutes(10));
        employee.SetVerificationToken(token, expiresAt);

        await users.AddAsync(employee, ct);
        await uow.SaveChangesAsync(ct);

        // Gửi email với OTP và link verification
        await email.SendCustomerApprovalWithVerificationAsync(
            employee.Email,
            employee.DisplayName,
            otp,
            token,
            ct);

        return Result<CreateEmployeeResponseDto>.Success(new CreateEmployeeResponseDto(
            "Employee account created successfully. Verification email has been sent.",
            employee.Id));
    }

    private static string GenerateOtp() => Random.Shared.Next(100000, 999999).ToString();
}
