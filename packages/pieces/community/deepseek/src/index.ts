import { AuthenticationType, HttpMethod, httpClient } from '@activepieces/pieces-common';
import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { sendChatAction } from './lib/actions/send-chat';
import { fimCompletionAction } from './lib/actions/fim-completion';
import { listModelsAction } from './lib/actions/list-models';
import { getUserBalanceAction } from './lib/actions/get-user-balance';

const baseUrl = 'https://api.deepseek.com/v1';
const markdownDescription = `
To obtain your API key:
1. Go to https://platform.deepseek.com/api_keys
2. Create a new API key
3. Copy the API key and paste it here
`;

export const deepseekAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: markdownDescription,
  required: true,
  validate: async (auth) => {
    try {
      await httpClient.sendRequest({
        url: `${baseUrl}/models`,
        method: HttpMethod.GET,
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: auth.auth as string,
        },
      });
      return {
        valid: true,
      };
    } catch (e) {
      return {
        valid: false,
        error: 'Invalid API key',
      };
    }
  },
});

export const deepseek = createPiece({
  displayName: 'DeepSeek',
  description: 'Use DeepSeek large language model APIs for chat completions, similar to OpenAI.',
  minimumSupportedRelease: '0.5.0',
  logoUrl: 'https://cdn.deepseek.com/platform/favicon.png',
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
  auth: deepseekAuth,
  actions: [sendChatAction, fimCompletionAction, listModelsAction, getUserBalanceAction],
  authors: ['devin'],
  triggers: [],
});
