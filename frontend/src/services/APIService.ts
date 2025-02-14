interface APIResponse<T> {
  data?: T;
  error?: string;
  version?: string;
}

interface TranscriptionResponse {
  transcription: string;
  category?: string;
}

class APIService {
  private baseUrl: string = "http://localhost:8000";
  private currentVersion: string = "1.0.0";
  private userID: string = "1234567890";

  private async makeRequest<T>(
    endpoint: string,
    method: "GET" | "POST" | "PUT" | "DELETE" = "GET",
    body?: FormData | object
  ): Promise<APIResponse<T>> {
    try {
      const headers: HeadersInit = {
        "X-Frontend-Version": this.currentVersion,
        "X-User-ID": this.userID
      };

      // Don't set Content-Type for FormData - browser will set it automatically
      if (body && !(body instanceof FormData)) {
        headers["Content-Type"] = "application/json";
      }
      
      const requestOptions: RequestInit = {
        method,
        headers,
        body: body instanceof FormData ? body : JSON.stringify(body),
      };
      
      console.log(`Making request to ${this.baseUrl}${endpoint} with options:`, requestOptions);
      const response = await fetch(
        `${this.baseUrl}${endpoint}`,
        requestOptions
      );

      if (!response.ok) {
        if (response.status === 426) {
          const errorData = await response.json();
          alert(
            `Version mismatch detected.\n` +
            `Server version: ${errorData.serverVersion}\n` +
            `Your frontend version: ${errorData.frontendVersion}\n\n` +
            `Please refresh your page to load the new version.`
          );
          return { error: errorData.error };
        }
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }
      
      const data = await response.json();
      return { data: data };
    } catch (error) {
      console.error("API Request failed:", error);
      return { error: `Request failed: ${error}` };
    }
  }

  async transcribeAudio(audioBlob: Blob): Promise<APIResponse<TranscriptionResponse>> {
    const formData = new FormData();
    formData.append("audio", audioBlob);

    return this.makeRequest<TranscriptionResponse>("/transcribe", "POST", formData);
  }
}

export default new APIService();