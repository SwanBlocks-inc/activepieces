import { createAction } from '@activepieces/pieces-framework';
import { AuthenticationType, HttpMethod, httpClient } from '@activepieces/pieces-common';

export const listModelsAction = createAction({
  displayName: 'List Models',
  description: 'Fetch the available DeepSeek models',
  name: 'list_models',
  props: {},
  async run(context) {
    const apiKey = context.auth as string;
    
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.deepseek.com/v1/models',
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: apiKey,
      },
    });

    return response.body;
  },
});
