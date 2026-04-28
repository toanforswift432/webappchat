using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ChatApp.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddContractCodeSupport : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "ContractCodeId",
                table: "Users",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RegistrationNote",
                table: "Users",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "ContractCodes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Code = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CompanyName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ContractCodes", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Users_ContractCodeId",
                table: "Users",
                column: "ContractCodeId");

            migrationBuilder.AddForeignKey(
                name: "FK_Users_ContractCodes_ContractCodeId",
                table: "Users",
                column: "ContractCodeId",
                principalTable: "ContractCodes",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Users_ContractCodes_ContractCodeId",
                table: "Users");

            migrationBuilder.DropTable(
                name: "ContractCodes");

            migrationBuilder.DropIndex(
                name: "IX_Users_ContractCodeId",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "ContractCodeId",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "RegistrationNote",
                table: "Users");
        }
    }
}
