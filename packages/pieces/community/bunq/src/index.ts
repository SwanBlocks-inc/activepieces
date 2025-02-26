import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { PieceAuth, createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { bunqDraftPayment } from './lib/actions/draft-payment';
import { bunqUpdateDraftPayment } from './lib/actions/update-draft-payment';
import { bunqCreatePaymentRequest } from './lib/actions/create-payment-request';
import { bunqPaymentReceived } from './lib/trigger/payment-received';

export const bunqAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  required: true,
  description: 'API key acquired from your Bunq dashboard',
});

export const bunq = createPiece({
  displayName: 'Bunq',
  description: 'Banking for the free',
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/bunq.png',
  categories: [PieceCategory.BANKING, PieceCategory.PAYMENT_PROCESSING],
  auth: bunqAuth,
  actions: [
    bunqDraftPayment,
    bunqUpdateDraftPayment,
    bunqCreatePaymentRequest,
    createCustomApiCallAction({
      baseUrl: () => 'https://public-api.sandbox.bunq.com/v1',
      auth: bunqAuth,
      authMapping: async (auth) => ({
        'X-Bunq-Client-Authentication': auth,
      }),
    }),
  ],
  triggers: [
    bunqPaymentReceived,
  ],
});
