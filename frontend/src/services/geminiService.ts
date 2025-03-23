
interface GeminiModel {
  name: string;
  displayName?: string;
  description?: string;
  supportedGenerationMethods?: string[];
  version?: string;
}

interface GeminiModelList {
  models: GeminiModel[];
}

interface GeminiPart {
  text: string;
}

interface GeminiContent {
  parts: GeminiPart[];
  role?: string;
}

interface GeminiCandidate {
  content: GeminiContent;
  finishReason?: string;
  index?: number;
  safetyRatings?: any[];
}

interface GeminiResponse {
  candidates: GeminiCandidate[];
  promptFeedback?: any;
}

// First, let's add a function to list available models
export const listAvailableGeminiModels = async (): Promise<GeminiModelList> => {
  const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
  
  if (!API_KEY) {
    throw new Error('Gemini API key is not configured');
  }
  
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${API_KEY}`);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error('Error fetching models:', errorData);
      throw new Error(`Failed to fetch models: ${response.status}`);
    }
    
    const data = await response.json() as GeminiModelList;
    console.log('Available models:', data);
    return data;
  } catch (error) {
    console.error('Error listing models:', error);
    throw error;
  }
};

// Updated Gemini API endpoint with multiple options to try
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// This function tries multiple model endpoints until one works
export const generateGeminiResponse = async (prompt: string): Promise<string> => {
  if (!API_KEY) {
    throw new Error('Gemini API key is not configured. Please check your environment variables.');
  }

  // Define model endpoints to try in order
  const modelEndpoints = [
    'https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent',
    'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:generateContent', 
    'https://generativelanguage.googleapis.com/v1/models/gemini-1.0-pro:generateContent',
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent'
  ];
  
  let lastError: Error | null = null;
  
  // Try each endpoint until one works
  for (const endpoint of modelEndpoints) {
    try {
      console.log(`Trying endpoint: ${endpoint}`);
      
      const response = await fetch(`${endpoint}?key=${API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048,
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.log(`Error with endpoint ${endpoint}:`, errorData);
        lastError = new Error(`API call failed with status: ${response.status}`);
        continue; // Try next endpoint
      }

      const data = await response.json() as GeminiResponse;
      
      if (!data.candidates || data.candidates.length === 0) {
        console.log(`No candidates returned from ${endpoint}`);
        continue; // Try next endpoint
      }

      console.log(`Success with endpoint: ${endpoint}`);
      return data.candidates[0].content.parts[0].text;
    } catch (error) {
      console.log(`Error with endpoint ${endpoint}:`, error);
      lastError = error instanceof Error ? error : new Error(String(error));
      // Continue to next endpoint
    }
  }
  
  // If we get here, all endpoints failed
  console.error('All Gemini API endpoints failed');
  throw lastError || new Error('All Gemini endpoints failed');
};

// Call this function on app startup to check available models
export const checkGeminiConfiguration = async (): Promise<boolean> => {
  try {
    const models = await listAvailableGeminiModels();
    console.log('Available Gemini models:', models);
    
    // Use the first available model that contains "gemini" in its name
    const availableModels = models.models || [];
    const geminiModels = availableModels.filter((model: GeminiModel) => model.name.includes('gemini'));
    
    if (geminiModels.length > 0) {
      console.log('Found Gemini models:', geminiModels.map(m => m.name).join(', '));
      return true;
    } else {
      console.warn('No Gemini models found in available models');
      return false;
    }
  } catch (error) {
    console.error('Failed to check Gemini configuration:', error);
    return false;
  }
};