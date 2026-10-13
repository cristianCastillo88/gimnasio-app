using FluentValidation;

namespace GymApp.Api.Common;

public class ValidationFilter<T> : IEndpointFilter where T : class
{
    private readonly IValidator<T>? _validator;

    public ValidationFilter(IValidator<T>? validator = null)
    {
        _validator = validator;
    }

    public async ValueTask<object?> InvokeAsync(EndpointFilterInvocationContext context, EndpointFilterDelegate next)
    {
        if (_validator is null)
        {
            return await next(context);
        }

        var argument = context.Arguments.OfType<T>().FirstOrDefault();
        if (argument is not null)
        {
            var validationResult = await _validator.ValidateAsync(argument, context.HttpContext.RequestAborted);
            if (!validationResult.IsValid)
            {
                return TypedResults.ValidationProblem(validationResult.ToDictionary());
            }
        }

        return await next(context);
    }
}

public static class ValidationFilterExtensions
{
    public static RouteHandlerBuilder WithValidation<T>(this RouteHandlerBuilder builder) where T : class
    {
        return builder.AddEndpointFilter<ValidationFilter<T>>();
    }
}
