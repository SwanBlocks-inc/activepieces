import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { bunqCommon } from '../common';
import { bunqAuth } from '../..';

export const bunqPaymentReceived = createTrigger({
  auth: bunqAuth,
  name: 'payment_received',
  displayName: 'Payment Received',
  description: 'Triggers when a new payment is received',
  props: {
    deviceName: Property.ShortText({
      displayName: 'Device Name',
      description: 'Name of the device to register with Bunq API',
      required: true,
      defaultValue: 'Activepieces Integration',
    }),
  },
  type: TriggerStrategy.WEBHOOK,
  sampleData: {
    NotificationUrl: {
      target_url: "https://example.com/webhook",
      category: "PAYMENT",
      event_type: "MUTATION",
      object: {
        Payment: {
          id: 12345,
          created: "2023-01-01 12:00:00.000",
          updated: "2023-01-01 12:00:00.000",
          monetary_account_id: 67890,
          amount: {
            value: "100.00",
            currency: "EUR"
          },
          description: "Payment description",
          type: "BUNQ",
          status: "PROCESSED",
          sub_status: "NONE",
          counterparty_alias: {
            iban: "NL00BUNQ0000000000",
            display_name: "John Doe",
            avatar: {
              uuid: "avatar-uuid"
            },
            label_user: {
              uuid: "user-uuid",
              display_name: "John Doe"
            }
          },
          attachment: [],
          merchant_reference: null,
          batch_id: null,
          scheduled_id: null,
          address_shipping: null,
          address_billing: null,
          geolocation: null,
          allow_chat: true,
          request_reference_split_the_bill: []
        }
      }
    }
  },
  async onEnable(context: any) {
    // Create API context
    const apiContext = await bunqCommon.createApiContext(
      context.auth,
      context.propsValue.deviceName
    );

    // Create notification filter for payment events
    const notificationFilterId = await bunqCommon.createNotificationFilter(
      apiContext.userId || 0,
      'PAYMENT',
      context.webhookUrl!,
      apiContext.sessionToken || ''
    );

    // Store API context and notification filter ID
    await context.store?.put('_payment_received_trigger', {
      userId: apiContext.userId,
      sessionToken: apiContext.sessionToken,
      notificationFilterId: notificationFilterId!,
      privateKey: apiContext.privateKey,
      serverPublicKey: apiContext.serverPublicKey,
    });
  },
  async onDisable(context: any) {
    const webhookInfo = await context.store?.get(
      '_payment_received_trigger'
    ) as WebhookInformation | null;
    
    if (webhookInfo !== null && webhookInfo !== undefined) {
      await bunqCommon.deleteNotificationFilter(
        webhookInfo.userId,
        webhookInfo.notificationFilterId,
        webhookInfo.sessionToken
      );
    }
  },
  async run(context: any) {
    const payloadBody = context.payload.body as PayloadBody;
    
    // Extract payment information from the notification
    if (payloadBody.NotificationUrl && 
        payloadBody.NotificationUrl.category === 'PAYMENT' && 
        payloadBody.NotificationUrl.object.Payment) {
      return [payloadBody.NotificationUrl.object.Payment];
    }
    
    return [];
  },
});

type PayloadBody = {
  NotificationUrl: {
    target_url: string;
    category: string;
    event_type: string;
    object: {
      Payment?: unknown;
    };
  };
};

interface WebhookInformation {
  userId: number;
  sessionToken: string;
  notificationFilterId: number;
  privateKey: string;
  serverPublicKey: string;
}
