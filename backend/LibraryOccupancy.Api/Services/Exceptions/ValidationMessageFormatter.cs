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

    // Anchored to RangeAttribute's exact default message shape ("... must be between {1} and
    // {2}.") with pure-integer captures - deliberately narrow, on purpose. A decimal bound (e.g.
    // [Range(0.0, 5.5)] -> "... between 0 and 5.5.") or a DateTime bound (e.g. "... between
    // 1/1/2020 12:00:00 AM and ...") breaks this pattern (the '.', '/', ':' interrupt the \d+ run
    // and the literal " and " no longer sits directly between two clean integers), so it simply
    // doesn't match instead of grabbing the wrong fragment (e.g. reading "5" out of "5.5", or a
    // day/month digit out of a date). A non-match falls through to the generic per-field message
    // below - correct-but-generic beats confidently wrong. Supporting double/DateTime ranges with
    // properly formatted messages would need the attribute's actual value type, which isn't
    // available here (see Format's callers - only the rendered message string reaches this point).
    private static readonly Regex IntegerRangePattern = new(
        @"must be between (?<min>-?\d+) and (?<max>-?\d+)\.?\s*$",
        RegexOptions.Compiled | RegexOptions.IgnoreCase);

    // Used by WebApplicationExtensions.ValidateFieldDisplayNamesConfiguration (Development-only
    // startup check) to catch DTO fields that carry a validation attribute but have no Turkish
    // display name here - such a field still works, it just falls back to its raw English property
    // name inside an otherwise-Turkish message (see the fallback in Format below).
    public static IReadOnlyCollection<string> GetUnmappedFieldNames(IEnumerable<string> fieldNames)
    {
        return fieldNames.Where(name => !FieldDisplayNames.ContainsKey(name)).Distinct().ToList();
    }

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
            var match = IntegerRangePattern.Match(defaultMessage);
            if (!match.Success)
            {
                return $"{field} alanı geçerli bir aralıkta olmalıdır.";
            }

            var min = match.Groups["min"].Value;
            var max = match.Groups["max"].Value;

            // [Range(1, int.MaxValue)] is the common "just needs a floor" idiom in this codebase -
            // showing "... 1 ile 2147483647 arasında olmalıdır." as a literal range is technically
            // correct but reads as broken to a user, so an int.MaxValue upper bound collapses to a
            // simple minimum-only message instead.
            return max == int.MaxValue.ToString()
                ? $"{field} alanı en az {min} olmalıdır."
                : $"{field} alanı {min} ile {max} arasında olmalıdır.";
        }

        return $"{field} alanı geçersiz.";
    }
}
