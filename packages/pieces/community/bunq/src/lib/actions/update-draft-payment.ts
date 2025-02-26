import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { bunqCommon } from '../common';
import { bunqAuth } from '../..';

export const bunqUpdateDraftPayment = createAction({
  name: 'update_draft_payment',
  auth: bunqAuth,
  displayName: 'Update Draft Payment',
  description: 'Update an existing draft payment in Bunq',
  props: {
    deviceName: Property.ShortText({
      displayName: 'Device Name',
      description: 'Name of the device to register with Bunq API',
      required: true,
      defaultValue: 'Activepieces Integration',
    }),
    userId: Property.Number({
      displayName: 'User ID',
      description: 'The ID of the user',
      required: true,
    }),
    monetaryAccountId: Property.Number({
      displayName: 'Monetary Account ID',
      description: 'The ID of the monetary account',
      required: true,
    }),
    draftPaymentId: Property.Number({
      displayName: 'Draft Payment ID',
      description: 'The ID of the draft payment to update',
      required: true,
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'The new status of the draft payment',
      required: true,
      options: {
        options: [
          { label: 'ACCEPTED', value: 'ACCEPTED' },
          { label: 'REJECTED', value: 'REJECTED' },
          { label: 'PENDING', value: 'PENDING' },
          { label: 'CANCELLED', value: 'CANCELLED' },
        ],
      },
    }),
  },
  async run(context: any) {
    // Create API context
    const apiContext = await bunqCommon.createApiContext(
      context.auth,
      context.propsValue.deviceName
    );

    // Update draft payment
    const request = {
      method: HttpMethod.PUT,
      url: `${bunqCommon.baseUrl}/user/${context.propsValue.userId}/monetary-account/${context.propsValue.monetaryAccountId}/draft-payment/${context.propsValue.draftPaymentId}`,
      headers: {
        'Content-Type': 'application/json',
        'X-Bunq-Client-Request-Id': require('crypto').randomUUID(),
        'X-Bunq-Client-Authentication': apiContext.sessionToken,
      },
      body: {
        status: context.propsValue.status,
      },
    };

    const { body: response } = await httpClient.sendRequest<{
      Response: Array<{
        Id: { id: number };
      }>;
    }>(request);

    return {
      success: true,
      draftPaymentId: context.propsValue.draftPaymentId,
      status: context.propsValue.status,
    };
  },
});
