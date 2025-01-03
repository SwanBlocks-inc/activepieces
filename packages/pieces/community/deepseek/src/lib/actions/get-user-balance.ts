import { createAction } from '@activepieces/pieces-framework';
import { AuthenticationType, HttpMethod, httpClient } from '@activepieces/pieces-common';

export const getUserBalanceAction = createAction({
  displayName: 'Get User Balance',
  description: 'Retrieve the current user\'s balance from DeepSeek',
  name: 'get_user_balance',
  props: {},
  async run(context) {
    const apiKey = context.auth as string;
    
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.deepseek.com/v1/balance',
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: apiKey,
      },
    });

    return response.body;
  },
});
