import { createAction, Property } from '@activepieces/pieces-framework';
import { AuthenticationType, HttpMethod, httpClient } from '@activepieces/pieces-common';

export const sendChatAction = createAction({
  displayName: 'Send Chat',
  description: 'Send a chat prompt using DeepSeek',
  name: 'send_chat',
  props: {
    model: Property.ShortText({
      displayName: 'Model',
      description: 'DeepSeek model to use (Default: deepseek-chat)',
      required: false,
    }),
    prompt: Property.LongText({
      displayName: 'Prompt',
      description: 'Your chat prompt',
      required: true,
    }),
    temperature: Property.Number({
      displayName: 'Temperature',
      description: 'Controls randomness in the response. Higher values (e.g., 0.8) make output more random, lower values (e.g., 0.2) make it more focused.',
      required: false,
      defaultValue: 0.7,
    }),
    maxTokens: Property.Number({
      displayName: 'Maximum Tokens',
      description: 'The maximum number of tokens to generate in the response.',
      required: false,
    }),
  },
  async run({ propsValue, auth }) {
    const model = propsValue.model || 'deepseek-chat';
    const prompt = propsValue.prompt;
    
    const body: Record<string, unknown> = {
      model: model,
      messages: [{ role: 'user', content: prompt }],
    };

    if (propsValue.temperature !== undefined) {
      body.temperature = propsValue.temperature;
    }

    if (propsValue.maxTokens !== undefined) {
      body.max_tokens = propsValue.maxTokens;
    }

    const response = await httpClient.sendRequest({
      url: 'https://api.deepseek.com/v1/chat/completions',
      method: HttpMethod.POST,
      body,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth as string,
      },
    });

    return response.body;
  },
});
