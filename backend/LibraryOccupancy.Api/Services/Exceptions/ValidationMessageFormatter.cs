using System.Text.RegularExpressions;

namespace LibraryOccupancy.Api.Services.Exceptions;

// ASP.NET Core's built-in DataAnnotations validation (Required/Range/EmailAddress/MaxLength/
// MinLength) produces hard-coded English messages at the framework level - unlike every other
// error in this API, there's no ErrorCode to route through ErrorMessages.Resolve(), only a
// formatted English string on ModelState with no attribute-type metadata attached to it anymore.
// Rather than pulling in a full localization pipeline (AddDataAnnotationsLocalization + resource
// files per DTO) for five well-known attribute types, this does simple, best-effort pattern
// matching against the framework's own stable default message templates to pick a Turkish
// template and re-insert the field name/bounds. It only recognizes the shape of the message, not
// which attribute produced it - anything unrecognized (custom attributes, future attribute types)
// falls back to a generic per-field message rather than leaking the raw English text or an
// attribute name.
public static class ValidationMessageFormatter
{
    private static readonly Dictionary<string, string> FieldDisplayNames = new(StringComparer.OrdinalIgnoreCase)
    {
        ["FullName"] = "Ad Soyad",
        ["Email"] = "E-posta",
        ["Password"] = "Şifre",
        ["Name"] = "İsim",
        ["Address"] = "Adres",
        ["City"] = "Şehir",
        ["District"] = "İlçe",
        ["Capacity"] = "Kapasite",
        ["Role"] = "Rol",
        ["RefreshToken"] = "Yenileme jetonu",
        ["QrToken"] = "QR kod",
    };

    private static readonly Regex NumberPattern = new(@"-?\d+", RegexOptions.Compiled);

    public static string Format(string fieldName, string defaultMessage)
    {
        var field = FieldDisplayNames.GetValueOrDefault(fieldName, fieldName);

        if (defaultMessage.Contains("is required", StringComparison.OrdinalIgnoreCase))
        {
            return $"{field} alanı zorunludur.";
        }

        if (defaultMessage.Contains("e-mail address", StringComparison.OrdinalIgnoreCase))
        {
            return $"{field} alanı geçerli bir e-posta adresi olmalıdır.";
        }

        if (defaultMessage.Contains("maximum length", StringComparison.OrdinalIgnoreCase))
        {
            var max = NumberPattern.Matches(defaultMessage).LastOrDefault()?.Value;
            return max is null ? $"{field} alanı çok uzun." : $"{field} alanı en fazla {max} karakter olabilir.";
        }

        if (defaultMessage.Contains("minimum length", StringComparison.OrdinalIgnoreCase))
        {
            var min = NumberPattern.Matches(defaultMessage).LastOrDefault()?.Value;
            return min is null ? $"{field} alanı çok kısa." : $"{field} alanı en az {min} karakter olmalıdır.";
        }

        if (defaultMessage.Contains("must be between", StringComparison.OrdinalIgnoreCase))
        {
            var bounds = NumberPattern.Matches(defaultMessage).Select(m => m.Value).ToList();
            if (bounds.Count < 2)
            {
                return $"{field} alanı geçerli bir aralıkta olmalıdır.";
            }

            // [Range(1, int.MaxValue)] is the common "just needs a floor" idiom in this codebase -
            // showing "... 1 ile 2147483647 arasında olmalıdır." as a literal range is technically
            // correct but reads as broken to a user, so an int.MaxValue upper bound collapses to a
            // simple minimum-only message instead.
            return bounds[1] == int.MaxValue.ToString()
                ? $"{field} alanı en az {bounds[0]} olmalıdır."
                : $"{field} alanı {bounds[0]} ile {bounds[1]} arasında olmalıdır.";
        }

        return $"{field} alanı geçersiz.";
    }
}
