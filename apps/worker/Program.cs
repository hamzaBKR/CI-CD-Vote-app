using StackExchange.Redis;
using Npgsql;
using System.Text.Json;

Console.WriteLine("Worker starting...");

var redisHost = Environment.GetEnvironmentVariable("REDIS_HOST") ?? "redis";
var postgresHost = Environment.GetEnvironmentVariable("POSTGRES_HOST") ?? "postgres";
var postgresUser = Environment.GetEnvironmentVariable("POSTGRES_USER") ?? "postgres";
var postgresPassword = Environment.GetEnvironmentVariable("POSTGRES_PASSWORD") ?? "postme";
var postgresDb = Environment.GetEnvironmentVariable("POSTGRES_DB") ?? "feedbackdb";

var redis = await ConnectionMultiplexer.ConnectAsync($"{redisHost}:6379");
var redisDb = redis.GetDatabase();

Console.WriteLine($"Connected to Redis at {redisHost}:6379");

var connectionString =
    $"Host={postgresHost};Port=5432;Username={postgresUser};Password={postgresPassword};Database={postgresDb}";

await using var pgConnection = new NpgsqlConnection(connectionString);

while (true)
{
    try
    {
        await pgConnection.OpenAsync();
        Console.WriteLine("Connected to PostgreSQL");
        break;
    }
    catch (Exception ex)
    {
        Console.WriteLine($"PostgreSQL not ready yet: {ex.Message}");
        Console.WriteLine("Retrying in 5 seconds...");
        await Task.Delay(5000);
    }
}

while (true)
{
    try
    {
        var result = await redisDb.ListRightPopAsync("feedback_queue");

        if (!result.IsNullOrEmpty)
        {
            Console.WriteLine($"Feedback received: {result}");

            var feedback = JsonSerializer.Deserialize<Feedback>(result!);

            if (feedback is not null)
            {
                var command = new NpgsqlCommand(
                    "INSERT INTO feedback (rating, comment) VALUES (@rating, @comment)",
                    pgConnection
                );

                command.Parameters.AddWithValue("rating", feedback.rating ?? "");
                command.Parameters.AddWithValue("comment", feedback.comment ?? "");

                await command.ExecuteNonQueryAsync();

                Console.WriteLine("Feedback inserted into PostgreSQL");
            }
        }
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Worker error: {ex.Message}");
    }

    await Task.Delay(2000);
}

public class Feedback
{
    public string? rating { get; set; }
    public string? comment { get; set; }
    public string? createdAt { get; set; }
}
