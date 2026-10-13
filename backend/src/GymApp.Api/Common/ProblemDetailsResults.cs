using Microsoft.AspNetCore.Http.HttpResults;

namespace GymApp.Api.Common;

public static class ProblemDetailsResults
{
    public static ProblemHttpResult NotFound(string detail, string title = "Recurso no encontrado")
    {
        return TypedResults.Problem(
            statusCode: StatusCodes.Status404NotFound,
            title: title,
            detail: detail,
            type: "https://tools.ietf.org/html/rfc9457"
        );
    }

    public static ProblemHttpResult Unauthorized(string detail = "Credenciales o token no autorizados.", string title = "No autorizado")
    {
        return TypedResults.Problem(
            statusCode: StatusCodes.Status401Unauthorized,
            title: title,
            detail: detail,
            type: "https://tools.ietf.org/html/rfc9457"
        );
    }

    public static ProblemHttpResult BadRequest(string detail, string title = "Solicitud inválida")
    {
        return TypedResults.Problem(
            statusCode: StatusCodes.Status400BadRequest,
            title: title,
            detail: detail,
            type: "https://tools.ietf.org/html/rfc9457"
        );
    }

    public static ProblemHttpResult Conflict(string detail, string title = "Conflicto de estado")
    {
        return TypedResults.Problem(
            statusCode: StatusCodes.Status409Conflict,
            title: title,
            detail: detail,
            type: "https://tools.ietf.org/html/rfc9457"
        );
    }

    public static ProblemHttpResult Forbidden(string detail = "Acceso denegado a este recurso.", string title = "Acceso denegado")
    {
        return TypedResults.Problem(
            statusCode: StatusCodes.Status403Forbidden,
            title: title,
            detail: detail,
            type: "https://tools.ietf.org/html/rfc9457"
        );
    }

    public static ProblemHttpResult ToProblemHttpResult<T>(this Result<T> result)
    {
        var error = result.Error;
        var detail = error?.Message ?? "Ocurrió un error inesperado.";
        var title = error?.Title;

        return result.Status switch
        {
            ResultStatus.NotFound => NotFound(detail, title ?? "Recurso no encontrado"),
            ResultStatus.Unauthorized => Unauthorized(detail, title ?? "No autorizado"),
            ResultStatus.Forbidden => Forbidden(detail, title ?? "Acceso denegado"),
            ResultStatus.Conflict => Conflict(detail, title ?? "Conflicto de estado"),
            _ => BadRequest(detail, title ?? "Solicitud inválida")
        };
    }
}
