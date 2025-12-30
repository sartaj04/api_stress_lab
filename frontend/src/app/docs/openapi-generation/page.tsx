import { Metadata } from 'next';
import OpenAPIGenerationClient from '@/components/OpenAPIGenerationClient';

export const metadata: Metadata = {
    title: 'Generate OpenAPI Spec - Framework Guides for Node, Python, Java',
    description: 'Generate OpenAPI 3.x specifications from your API. Complete guides for Express, FastAPI, Spring Boot, Rails, Django, and .NET. Step-by-step code examples.',
    keywords: [
        'OpenAPI generation',
        'Swagger spec',
        'generate OpenAPI',
        'Express OpenAPI',
        'FastAPI OpenAPI',
        'Spring Boot OpenAPI',
        'API documentation',
        'OpenAPI 3.0',
        'Swagger documentation',
    ],
    alternates: {
        canonical: 'https://apistresslab.com/docs/openapi-generation',
    },
    openGraph: {
        title: 'Generate OpenAPI Spec - All Frameworks',
        description: 'Complete guides for generating OpenAPI specs from your API.',
        url: 'https://apistresslab.com/docs/openapi-generation',
        type: 'article',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Generate OpenAPI Spec - All Frameworks',
        description: 'Complete guides for generating OpenAPI specs from your API.',
    },
};

export default function OpenAPIGenerationPage() {
    return <OpenAPIGenerationClient />;
}
