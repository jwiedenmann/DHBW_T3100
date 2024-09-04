using GraphVisualizer.DataAccess;

const string _corsOrigins = "_myAllowSpecificOrigins";

var builder = WebApplication.CreateBuilder(args);

// Bind to 0.0.0.0:80 to listen to all interfaces (this includes the Docker bridge)
if (!builder.Environment.IsDevelopment())
{
    builder.WebHost.UseUrls("http://0.0.0.0:80");
}

builder.Services.AddCors(options =>
{
    options.AddPolicy(name: _corsOrigins,
                      policy =>
                      {
                          policy
                            .AllowAnyOrigin()
                            .AllowAnyHeader()
                            .AllowAnyMethod();
                      });
});
builder.Services.AddControllers();

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddMemoryCache();

builder.Services.AddHttpClient<SparqlRepository>();

builder.Services.AddTransient<ISparqlRepository, SparqlRepository>();

var app = builder.Build();

// app.UseHttpsRedirection();

app.UseCors(_corsOrigins);

app.UseDefaultFiles();
app.UseStaticFiles();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.MapControllers();

app.Run();
