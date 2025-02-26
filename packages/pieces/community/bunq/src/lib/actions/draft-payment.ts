import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { bunqCommon } from '../common';
import { bunqAuth } from '../..';

export const bunqDraftPayment = createAction({
  name: 'draft_payment',
  auth: bunqAuth,
  displayName: 'Create Draft Payment',
  description: 'Create a draft payment in Bunq',
  props: {
    deviceName: Property.ShortText({
      displayName: 'Device Name',
      description: 'Name of the device to register with Bunq API',
      required: true,
      defaultValue: 'Activepieces Integration',
    }),
    monetaryAccountId: Property.Dropdown({
      displayName: 'Monetary Account',
      description: 'The monetary account from which the payment will be made',
      required: true,
      refreshers: ['deviceName'],
      options: async ({ auth, deviceName }: { auth: string; deviceName: string }) => {
        if (!auth || !deviceName) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please enter API key and device name first',
          };
        }

        try {
          const apiContext = await bunqCommon.createApiContext(
            auth as string,
            deviceName as string
          );

          const accounts = await bunqCommon.getMonetaryAccounts(
            apiContext.userId || 0,
            apiContext.sessionToken
          );

          return {
            options: accounts.map((account) => {
              return {
                label: account.description,
                value: account.id.toString(),
              };
            }),
          };
        } catch (error) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Error fetching accounts: ' + (error as Error).message,
          };
        }
      },
    }),
    counterpartyAlias: Property.ShortText({
      displayName: 'Counterparty IBAN',
      description: 'The IBAN of the payment recipient',
      required: true,
    }),
    counterpartyName: Property.ShortText({
      displayName: 'Counterparty Name',
      description: 'The name of the payment recipient',
      required: true,
    }),
    amount: Property.Number({
      displayName: 'Amount',
      description: 'The amount to transfer (in euros)',
      required: true,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'The description of the payment',
      required: true,
    }),
  },
  async run(context: any) {
    // Create API context
    const apiContext = await bunqCommon.createApiContext(
      context.auth,
      context.propsValue.deviceName
    );

    // Create draft payment
    const request = {
      method: HttpMethod.POST,
      url: `${bunqCommon.baseUrl}/user/${apiContext.userId}/monetary-account/${context.propsValue.monetaryAccountId}/draft-payment`,
      headers: {
        'Content-Type': 'application/json',
        'X-Bunq-Client-Request-Id': require('crypto').randomUUID(),
        'X-Bunq-Client-Authentication': apiContext.sessionToken,
      },
      body: {
        amount: {
          value: context.propsValue.amount.toString(),
          currency: 'EUR',
        },
        counterparty_alias: {
          type: 'IBAN',
          value: context.propsValue.counterpartyAlias,
          name: context.propsValue.counterpartyName,
        },
        description: context.propsValue.description,
      },
    };

    const { body: response } = await httpClient.sendRequest<{
      Response: Array<{
        Id: { id: number };
      }>;
    }>(request);

    const draftPaymentId = response.Response.find(item => item.Id)?.Id.id;

    return {
      draftPaymentId,
      userId: apiContext.userId,
      monetaryAccountId: context.propsValue.monetaryAccountId,
    };
  },
});
