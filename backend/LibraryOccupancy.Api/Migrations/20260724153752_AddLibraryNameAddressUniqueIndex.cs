using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LibraryOccupancy.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddLibraryNameAddressUniqueIndex : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_Libraries_Name_Address",
                table: "Libraries",
                columns: new[] { "Name", "Address" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Libraries_Name_Address",
                table: "Libraries");
        }
    }
}
