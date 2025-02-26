import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { bunqCommon } from '../common';
import { bunqAuth } from '../..';

export const bunqCreatePaymentRequest = createAction({
  name: 'create_payment_request',
  auth: bunqAuth,
  displayName: 'Create Payment Request',
  description: 'Create a payment request in Bunq',
  props: {
    deviceName: Property.ShortText({
      displayName: 'Device Name',
      description: 'Name of the device to register with Bunq API',
      required: true,
      defaultValue: 'Activepieces Integration',
    }),
    monetaryAccountId: Property.Dropdown({
      displayName: 'Monetary Account',
      description: 'The monetary account from which the payment request will be made',
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
      description: 'The IBAN of the payment requestee',
      required: true,
    }),
    counterpartyName: Property.ShortText({
      displayName: 'Counterparty Name',
      description: 'The name of the payment requestee',
      required: true,
    }),
    amount: Property.Number({
      displayName: 'Amount',
      description: 'The amount to request (in euros)',
      required: true,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'The description of the payment request',
      required: true,
    }),
    allowBunqme: Property.Checkbox({
      displayName: 'Allow bunq.me',
      description: 'Whether or not to allow the user to pay through bunq.me',
      required: false,
      defaultValue: false,
    }),
    redirectUrl: Property.ShortText({
      displayName: 'Redirect URL',
      description: 'The URL to redirect to after the payment is completed',
      required: false,
    }),
  },
  async run(context: any) {
    // Create API context
    const apiContext = await bunqCommon.createApiContext(
      context.auth,
      context.propsValue.deviceName
    );

    // Create payment request
    const request = {
      method: HttpMethod.POST,
      url: `${bunqCommon.baseUrl}/user/${apiContext.userId}/monetary-account/${context.propsValue.monetaryAccountId}/request-inquiry`,
      headers: {
        'Content-Type': 'application/json',
        'X-Bunq-Client-Request-Id': require('crypto').randomUUID(),
        'X-Bunq-Client-Authentication': apiContext.sessionToken,
      },
      body: {
        amount_inquired: {
          value: context.propsValue.amount.toString(),
          currency: 'EUR',
        },
        counterparty_alias: {
          type: 'IBAN',
          value: context.propsValue.counterpartyAlias,
          name: context.propsValue.counterpartyName,
        },
        description: context.propsValue.description,
        allow_bunqme: context.propsValue.allowBunqme,
        redirect_url: context.propsValue.redirectUrl,
      },
    };

    const { body: response } = await httpClient.sendRequest<{
      Response: Array<{
        Id: { id: number };
      }>;
    }>(request);

    const requestInquiryId = response.Response.find(item => item.Id)?.Id.id;

    return {
      requestInquiryId,
      userId: apiContext.userId,
      monetaryAccountId: context.propsValue.monetaryAccountId,
    };
  },
});
