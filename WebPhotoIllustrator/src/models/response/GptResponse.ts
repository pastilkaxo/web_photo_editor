export interface IGptResponse {
    generatedText: string;
}

export interface IImageGenerationResponse {
    imageUrl: string;
}

export interface IImageGenerationError {
    message: string;
    retryAfter?: number;
}