using GraphVisualizer.DataAccess;

const string _corsOrigins = "_myAllowSpecificOrigins";

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddCors(options =>
{
    options.AddPolicy(name: _corsOrigins,
                      policy =>
                      {
                          policy.WithOrigins(
                              "http://localhost:4999",
                              "http://localhost:5000",
                              "http://localhost:5001");
                      });
});
builder.Services.AddControllers();

builder.Services.AddHttpClient<SparqlRepository>();

builder.Services.AddTransient<ISparqlRepository, SparqlRepository>();

var app = builder.Build();

app.UseHttpsRedirection();

app.UseDefaultFiles();
app.UseStaticFiles();

if (app.Environment.IsDevelopment())
{
    app.UseCors(_corsOrigins);
}

app.MapControllers();

app.Run();
