import { createAction, Property } from '@activepieces/pieces-framework';
import { AuthenticationType, HttpMethod, httpClient } from '@activepieces/pieces-common';

export const fimCompletionAction = createAction({
  displayName: 'Create FIM Completion (Beta)',
  description: 'Create a Fill-In-the-Middle (FIM) completion via the DeepSeek API',
  name: 'create_fim_completion',
  props: {
    prefix: Property.LongText({
      displayName: 'Prefix',
      description: 'The text that comes before the completion',
      required: true,
    }),
    suffix: Property.LongText({
      displayName: 'Suffix',
      description: 'The text that comes after the completion',
      required: true,
    }),
    model: Property.StaticDropdown({
      displayName: 'Model',
      description: 'The model to use for the completion',
      required: true,
      defaultValue: 'deepseek-coder',
      options: {
        options: [
          { label: 'DeepSeek Coder', value: 'deepseek-coder' },
        ],
      },
    }),
    temperature: Property.Number({
      displayName: 'Temperature',
      description: 'Controls randomness: Lowering results in less random completions. As the temperature approaches zero, the model will become deterministic and repetitive.',
      required: false,
      defaultValue: 0.7,
    }),
    maxTokens: Property.Number({
      displayName: 'Maximum Tokens',
      description: 'The maximum number of tokens to generate',
      required: false,
      defaultValue: 256,
    }),
  },
  async run(context) {
    const { prefix, suffix, model, temperature, maxTokens } = context.propsValue;
    const apiKey = context.auth as string;

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://api.deepseek.com/v1/completions',
      body: {
        model,
        prefix,
        suffix,
        temperature,
        max_tokens: maxTokens,
      },
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: apiKey,
      },
    });

    return response.body;
  },
});
