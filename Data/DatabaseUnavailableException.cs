namespace WeddingStudioInvite.Data;

public sealed class DatabaseUnavailableException(string message, Exception innerException)
    : Exception(message, innerException);
