namespace GymApp.Api.Common;

public enum ResultStatus
{
    Ok,
    NotFound,
    BadRequest,
    Conflict,
    Forbidden,
    Unauthorized
}

public readonly record struct ErrorDetail(string Message, string? Title = null, string? Property = null);

public class Result<T>
{
    public bool IsSuccess => Status == ResultStatus.Ok;
    public ResultStatus Status { get; }
    public T? Value { get; }
    public ErrorDetail? Error { get; }

    private Result(T value)
    {
        Status = ResultStatus.Ok;
        Value = value;
        Error = null;
    }

    private Result(ResultStatus status, ErrorDetail error)
    {
        Status = status;
        Value = default;
        Error = error;
    }

    public static Result<T> Success(T value) => new(value);

    public static Result<T> NotFound(string message, string? title = null) =>
        new(ResultStatus.NotFound, new ErrorDetail(message, title ?? "Recurso no encontrado"));

    public static Result<T> BadRequest(string message, string? title = null, string? property = null) =>
        new(ResultStatus.BadRequest, new ErrorDetail(message, title ?? "Solicitud inválida", property));

    public static Result<T> Conflict(string message, string? title = null) =>
        new(ResultStatus.Conflict, new ErrorDetail(message, title ?? "Conflicto de estado"));

    public static Result<T> Unauthorized(string message = "No autenticado", string? title = null) =>
        new(ResultStatus.Unauthorized, new ErrorDetail(message, title ?? "No autorizado"));

    public static Result<T> Forbidden(string message = "Acceso denegado", string? title = null) =>
        new(ResultStatus.Forbidden, new ErrorDetail(message, title ?? "Acceso denegado"));
}
