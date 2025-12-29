'use client';

import Link from 'next/link';
import Logo from '@/components/Logo';
import { useState } from 'react';

export default function OpenAPIGenerationPage() {
    const [activeFramework, setActiveFramework] = useState('express');

    const frameworks = [
        { id: 'express', name: 'Node.js / Express', icon: '🟢' },
        { id: 'fastapi', name: 'Python / FastAPI', icon: '🐍' },
        { id: 'spring', name: 'Java / Spring Boot', icon: '☕' },
        { id: 'rails', name: 'Ruby / Rails', icon: '💎' },
        { id: 'django', name: 'Python / Django', icon: '🐍' },
        { id: 'dotnet', name: '.NET / ASP.NET', icon: '🔷' },
    ];

    return (
        <main className="min-h-screen" style={{ background: '#111113' }}>
            {/* Navigation */}
            <nav className="nav fixed top-0 left-0 right-0 z-50">
                <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
                    <Link href="/">
                        <Logo size="md" />
                    </Link>
                    <div className="flex items-center gap-6">
                        <Link href="/docs" className="text-white/60 hover:text-white text-sm transition">
                            Documentation
                        </Link>
                        <Link href="/" className="text-white/60 hover:text-white text-sm transition">
                            Home
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Content */}
            <div className="pt-32 pb-20 px-6">
                <div className="max-w-4xl mx-auto">
                    <Link href="/docs" className="text-emerald-400 hover:text-emerald-300 text-sm mb-6 inline-flex items-center gap-2 transition">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M19 12H5M12 19l-7-7 7-7" />
                        </svg>
                        Back to Documentation
                    </Link>

                    <h1 className="text-4xl md:text-5xl font-semibold text-white mb-4 mt-6">
                        Generate OpenAPI Specification
                    </h1>
                    <p className="text-white/50 text-lg mb-12">
                        Framework-specific guides to generate an OpenAPI 3.x specification from your existing API
                    </p>

                    {/* Framework Tabs */}
                    <div className="mb-8">
                        <div className="flex flex-wrap gap-2 mb-8">
                            {frameworks.map((framework) => (
                                <button
                                    key={framework.id}
                                    onClick={() => setActiveFramework(framework.id)}
                                    className={`px-4 py-2.5 rounded-lg text-sm font-medium transition flex items-center gap-2 ${
                                        activeFramework === framework.id
                                            ? 'bg-white text-black'
                                            : 'bg-white/[0.04] text-white/60 hover:bg-white/[0.08] border border-white/[0.08]'
                                    }`}
                                >
                                    <span>{framework.icon}</span>
                                    {framework.name}
                                </button>
                            ))}
                        </div>

                        {/* Content for each framework */}
                        <div className="bg-white/[0.02] border border-white/[0.08] rounded-xl p-8">
                            {activeFramework === 'express' && (
                                <div className="space-y-6">
                                    <h2 className="text-2xl font-semibold text-white">Node.js / Express</h2>

                                    <div>
                                        <h3 className="text-lg font-semibold text-white mb-3">Using swagger-jsdoc</h3>
                                        <p className="text-white/50 mb-4">
                                            The most popular way to generate OpenAPI specs in Express is using JSDoc comments with swagger-jsdoc.
                                        </p>

                                        <div className="bg-black/40 rounded-lg p-4 font-mono text-sm mb-4">
                                            <div className="text-white/40 mb-2"># Install dependencies</div>
                                            <div className="text-emerald-400">npm install swagger-jsdoc swagger-ui-express</div>
                                        </div>

                                        <div className="bg-black/40 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                                            <pre className="text-white/80">
{`// swagger.js
const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'My API',
      version: '1.0.0',
      description: 'API Documentation',
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
    ],
  },
  apis: ['./routes/*.js'], // Path to API routes
};

const specs = swaggerJsdoc(options);
module.exports = specs;`}
                                            </pre>
                                        </div>

                                        <div className="bg-black/40 rounded-lg p-4 font-mono text-sm overflow-x-auto mt-4">
                                            <pre className="text-white/80">
{`// app.js
const express = require('express');
const swaggerUi = require('swagger-ui-express');
const specs = require('./swagger');

const app = express();

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// Your routes with JSDoc comments
/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get all users
 *     responses:
 *       200:
 *         description: Success
 */
app.get('/users', (req, res) => {
  res.json({ users: [] });
});`}
                                            </pre>
                                        </div>

                                        <p className="text-white/50 mt-4">
                                            Access your OpenAPI spec at <code className="bg-white/[0.1] px-2 py-1 rounded text-emerald-400 text-sm">http://localhost:3000/api-docs</code>
                                        </p>
                                    </div>
                                </div>
                            )}

                            {activeFramework === 'fastapi' && (
                                <div className="space-y-6">
                                    <h2 className="text-2xl font-semibold text-white">Python / FastAPI</h2>

                                    <div>
                                        <h3 className="text-lg font-semibold text-white mb-3">Built-in OpenAPI Support</h3>
                                        <p className="text-white/50 mb-4">
                                            FastAPI automatically generates OpenAPI specs from your type hints and docstrings.
                                        </p>

                                        <div className="bg-black/40 rounded-lg p-4 font-mono text-sm mb-4">
                                            <div className="text-white/40 mb-2"># Install FastAPI</div>
                                            <div className="text-emerald-400">pip install fastapi uvicorn</div>
                                        </div>

                                        <div className="bg-black/40 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                                            <pre className="text-white/80">
{`from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI(
    title="My API",
    description="API Documentation",
    version="1.0.0"
)

class User(BaseModel):
    id: int
    name: str
    email: str

@app.get("/users", tags=["users"])
async def get_users():
    """
    Get all users from the system.

    Returns a list of user objects.
    """
    return {"users": []}

@app.post("/users", tags=["users"])
async def create_user(user: User):
    """Create a new user"""
    return {"user": user}`}
                                            </pre>
                                        </div>

                                        <p className="text-white/50 mt-4">
                                            Access your OpenAPI spec at <code className="bg-white/[0.1] px-2 py-1 rounded text-emerald-400 text-sm">http://localhost:8000/openapi.json</code>
                                        </p>
                                        <p className="text-white/50 mt-2">
                                            Interactive docs at <code className="bg-white/[0.1] px-2 py-1 rounded text-emerald-400 text-sm">http://localhost:8000/docs</code>
                                        </p>
                                    </div>
                                </div>
                            )}

                            {activeFramework === 'spring' && (
                                <div className="space-y-6">
                                    <h2 className="text-2xl font-semibold text-white">Java / Spring Boot</h2>

                                    <div>
                                        <h3 className="text-lg font-semibold text-white mb-3">Using SpringDoc OpenAPI</h3>
                                        <p className="text-white/50 mb-4">
                                            SpringDoc automatically generates OpenAPI documentation from your Spring Boot REST APIs.
                                        </p>

                                        <div className="bg-black/40 rounded-lg p-4 font-mono text-sm mb-4">
                                            <div className="text-white/40 mb-2">{`<!-- Add to pom.xml -->`}</div>
                                            <pre className="text-emerald-400">
{`<dependency>
    <groupId>org.springdoc</groupId>
    <artifactId>springdoc-openapi-starter-webmvc-ui</artifactId>
    <version>2.0.0</version>
</dependency>`}
                                            </pre>
                                        </div>

                                        <div className="bg-black/40 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                                            <pre className="text-white/80">
{`// application.properties
springdoc.api-docs.path=/api-docs
springdoc.swagger-ui.path=/swagger-ui.html

// UserController.java
@RestController
@RequestMapping("/users")
@Tag(name = "Users", description = "User management APIs")
public class UserController {

    @GetMapping
    @Operation(summary = "Get all users")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Success")
    })
    public List<User> getUsers() {
        return userService.findAll();
    }
}`}
                                            </pre>
                                        </div>

                                        <p className="text-white/50 mt-4">
                                            Access your OpenAPI spec at <code className="bg-white/[0.1] px-2 py-1 rounded text-emerald-400 text-sm">http://localhost:8080/api-docs</code>
                                        </p>
                                    </div>
                                </div>
                            )}

                            {activeFramework === 'rails' && (
                                <div className="space-y-6">
                                    <h2 className="text-2xl font-semibold text-white">Ruby / Rails</h2>

                                    <div>
                                        <h3 className="text-lg font-semibold text-white mb-3">Using rswag</h3>
                                        <p className="text-white/50 mb-4">
                                            rswag generates OpenAPI specs from RSpec integration tests.
                                        </p>

                                        <div className="bg-black/40 rounded-lg p-4 font-mono text-sm mb-4">
                                            <div className="text-white/40 mb-2"># Add to Gemfile</div>
                                            <div className="text-emerald-400">{`gem 'rswag'`}</div>
                                            <div className="text-white/40 mt-2"># Install</div>
                                            <div className="text-emerald-400">bundle install</div>
                                            <div className="text-emerald-400">rails g rswag:install</div>
                                        </div>

                                        <div className="bg-black/40 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                                            <pre className="text-white/80">
{`# spec/integration/users_spec.rb
require 'swagger_helper'

describe 'Users API' do
  path '/users' do
    get 'Retrieves all users' do
      tags 'Users'
      produces 'application/json'

      response '200', 'users found' do
        schema type: :array,
          items: {
            type: :object,
            properties: {
              id: { type: :integer },
              name: { type: :string }
            }
          }

        run_test!
      end
    end
  end
end`}
                                            </pre>
                                        </div>

                                        <div className="bg-black/40 rounded-lg p-4 font-mono text-sm mt-4">
                                            <div className="text-white/40 mb-2"># Generate OpenAPI spec</div>
                                            <div className="text-emerald-400">rake rswag:specs:swaggerize</div>
                                        </div>

                                        <p className="text-white/50 mt-4">
                                            Find your OpenAPI spec at <code className="bg-white/[0.1] px-2 py-1 rounded text-emerald-400 text-sm">swagger/v1/swagger.yaml</code>
                                        </p>
                                    </div>
                                </div>
                            )}

                            {activeFramework === 'django' && (
                                <div className="space-y-6">
                                    <h2 className="text-2xl font-semibold text-white">Python / Django</h2>

                                    <div>
                                        <h3 className="text-lg font-semibold text-white mb-3">Using drf-spectacular</h3>
                                        <p className="text-white/50 mb-4">
                                            drf-spectacular generates OpenAPI specs for Django REST Framework.
                                        </p>

                                        <div className="bg-black/40 rounded-lg p-4 font-mono text-sm mb-4">
                                            <div className="text-white/40 mb-2"># Install</div>
                                            <div className="text-emerald-400">pip install drf-spectacular</div>
                                        </div>

                                        <div className="bg-black/40 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                                            <pre className="text-white/80">
{`# settings.py
INSTALLED_APPS = [
    'rest_framework',
    'drf_spectacular',
]

REST_FRAMEWORK = {
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
}

SPECTACULAR_SETTINGS = {
    'TITLE': 'My API',
    'VERSION': '1.0.0',
    'SERVE_INCLUDE_SCHEMA': False,
}

# urls.py
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

urlpatterns = [
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema')),
]`}
                                            </pre>
                                        </div>

                                        <p className="text-white/50 mt-4">
                                            Access your OpenAPI spec at <code className="bg-white/[0.1] px-2 py-1 rounded text-emerald-400 text-sm">http://localhost:8000/api/schema/</code>
                                        </p>
                                    </div>
                                </div>
                            )}

                            {activeFramework === 'dotnet' && (
                                <div className="space-y-6">
                                    <h2 className="text-2xl font-semibold text-white">.NET / ASP.NET Core</h2>

                                    <div>
                                        <h3 className="text-lg font-semibold text-white mb-3">Using Swashbuckle</h3>
                                        <p className="text-white/50 mb-4">
                                            Swashbuckle automatically generates OpenAPI specs for ASP.NET Core APIs.
                                        </p>

                                        <div className="bg-black/40 rounded-lg p-4 font-mono text-sm mb-4">
                                            <div className="text-white/40 mb-2"># Install NuGet package</div>
                                            <div className="text-emerald-400">dotnet add package Swashbuckle.AspNetCore</div>
                                        </div>

                                        <div className="bg-black/40 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                                            <pre className="text-white/80">
{`// Program.cs
var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "My API",
        Version = "v1",
        Description = "API Documentation"
    });
});

var app = builder.Build();

app.UseSwagger();
app.UseSwaggerUI();
app.MapControllers();
app.Run();`}
                                            </pre>
                                        </div>

                                        <div className="bg-black/40 rounded-lg p-4 font-mono text-sm overflow-x-auto mt-4">
                                            <pre className="text-white/80">
{`// Controllers/UsersController.cs
[ApiController]
[Route("[controller]")]
public class UsersController : ControllerBase
{
    /// <summary>
    /// Get all users
    /// </summary>
    /// <returns>List of users</returns>
    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public IActionResult GetUsers()
    {
        return Ok(new { users = new List<object>() });
    }
}`}
                                            </pre>
                                        </div>

                                        <p className="text-white/50 mt-4">
                                            Access your OpenAPI spec at <code className="bg-white/[0.1] px-2 py-1 rounded text-emerald-400 text-sm">http://localhost:5000/swagger/v1/swagger.json</code>
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Next Steps */}
                    <div className="bg-gradient-to-br from-emerald-500/10 to-blue-500/10 border border-emerald-500/20 rounded-xl p-6 mt-12">
                        <h3 className="text-xl font-semibold text-white mb-3">Next Steps</h3>
                        <p className="text-white/60 mb-4">
                            Once you&apos;ve generated your OpenAPI specification, you&apos;re ready to test your API.
                        </p>
                        <Link href="/signup" className="inline-flex items-center gap-2 bg-white hover:bg-white/90 text-black font-semibold px-6 py-3 rounded-xl transition">
                            Start Testing Your API
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M5 12h14M12 5l7 7-7 7" />
                            </svg>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="py-8 px-6 border-t border-white/[0.06]">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
                    <span className="text-white/30 text-sm">API Stress Lab</span>
                    <div className="flex flex-wrap gap-4 md:gap-6 text-white/30 text-sm justify-center">
                        <Link href="/docs" className="hover:text-white/50 transition">
                            Documentation
                        </Link>
                        <Link href="/docs/openapi-generation" className="hover:text-white/50 transition">
                            Generate OpenAPI Spec
                        </Link>
                    </div>
                </div>
            </footer>
        </main>
    );
}
