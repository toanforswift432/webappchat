using ChatApp.Application.Common;
using ChatApp.Application.DTOs;
using ChatApp.Application.Interfaces;
using ChatApp.Domain.Entities;
using ChatApp.Domain.Enums;
using MediatR;

namespace ChatApp.Application.Features.Auth;

// ── Customer registration (no password, pending admin approval) ──────────────
public record RegisterCustomerCommand(
    string Email,
    string DisplayName,
    string PhoneNumber,
    Guid ContractCodeId,
    string? RegistrationNote) : IRequest<Result<RegisterResponseDto>>;

// ── Employee registration (invite code validated by controller) ──────────────
public record RegisterEmployeeCommand(
    string Email,
    string Password,
    string DisplayName,
    string PhoneNumber) : IRequest<Result<RegisterResponseDto>>;

// Response trả OTP để test (bỏ OtpCode khi production)
public record RegisterResponseDto(string Message, string? OtpCode = null);

// ── Customer handler ──────────────────────────────────────────────────────────
public class RegisterCustomerCommandHandler(
    IUserRepository users,
    IContractCodeRepository contractCodes,
    IEmailService email,
    IUnitOfWork uow)
    : IRequestHandler<RegisterCustomerCommand, Result<RegisterResponseDto>>
{
    public async Task<Result<RegisterResponseDto>> Handle(RegisterCustomerCommand request, CancellationToken ct)
    {
        if (await users.GetByEmailAsync(request.Email, ct) is not null)
            return Result<RegisterResponseDto>.Failure("Email already in use.");

        if (await users.GetByPhoneAsync(request.PhoneNumber, ct) is not null)
            return Result<RegisterResponseDto>.Failure("Phone number already in use.");

        // Validate contract code
        var contractCode = await contractCodes.GetByIdAsync(request.ContractCodeId, ct);
        if (contractCode is null)
            return Result<RegisterResponseDto>.Failure("Invalid contract code.");

        if (!contractCode.IsActive)
            return Result<RegisterResponseDto>.Failure("The selected contract code is no longer active.");

        // Tạo Customer không có password, chờ admin duyệt
        var user = User.CreateCustomerWithoutPassword(
            request.Email,
            request.DisplayName,
            request.PhoneNumber,
            request.ContractCodeId,
            request.RegistrationNote);

        await users.AddAsync(user, ct);
        await uow.SaveChangesAsync(ct);

        // Gửi email thông báo đăng ký thành công, chờ admin duyệt
        await email.SendRegistrationPendingAsync(user.Email, user.DisplayName, ct);

        return Result<RegisterResponseDto>.Success(new RegisterResponseDto(
            "Registration successful. Your account is pending admin approval. You will receive an email with verification instructions once approved."));
    }
}

// ── Employee handler ──────────────────────────────────────────────────────────
public class RegisterEmployeeCommandHandler(
    IUserRepository users,
    IEmailService email,
    IUnitOfWork uow)
    : IRequestHandler<RegisterEmployeeCommand, Result<RegisterResponseDto>>
{
    public async Task<Result<RegisterResponseDto>> Handle(RegisterEmployeeCommand request, CancellationToken ct)
    {
        if (await users.GetByEmailAsync(request.Email, ct) is not null)
            return Result<RegisterResponseDto>.Failure("Email already in use.");

        if (await users.GetByPhoneAsync(request.PhoneNumber, ct) is not null)
            return Result<RegisterResponseDto>.Failure("Phone number already in use.");

        var hash = BCrypt.Net.BCrypt.HashPassword(request.Password);
        var user = User.Create(request.Email, hash, request.DisplayName, request.PhoneNumber, AccountType.Employee);

        var otp = GenerateOtp();
        user.SetOtp(otp, DateTime.UtcNow.AddMinutes(10));

        await users.AddAsync(user, ct);
        await uow.SaveChangesAsync(ct);

        await email.SendOtpAsync(user.Email, user.DisplayName, otp, ct);

        return Result<RegisterResponseDto>.Success(new RegisterResponseDto(
            "Registration successful. Please verify your OTP. Your account will be active after admin approval.", otp));
    }

    private static string GenerateOtp() => Random.Shared.Next(100000, 999999).ToString();
}
