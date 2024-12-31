import { test } from '@playwright/test';
import { builder } from '../page/builder';
import { flows } from '../page/flows';
import { authentication } from '../page/authentication';
import { faker } from '@faker-js/faker'
import { globalConfig } from '../config';

test('Test OpenAI Flow', async ({ page }) => {
  test.setTimeout(100000);
  const email = faker.internet.email();
  await authentication.signUp(page, {
    email: email,
    password: globalConfig.password
  });

  await flows.newFlowFromScratch(page);
  
  // Set up a daily trigger
  await builder.selectInitialTrigger(page, {
    piece: 'Schedule',
    trigger: 'Every Day'
  });

  // Add OpenAI Chat action
  await builder.addAction(page, {
    piece: 'OpenAI',
    action: 'Ask ChatGPT'
  });

  // Configure OpenAI action settings
  await builder.property.selectDropdown(page, {
    property: 'Model',
    value: 'gpt-3.5-turbo'
  });
  
  await page.getByLabel('Prompt').fill('What is the current date?');
  
  await builder.property.selectDropdown(page, {
    property: 'Temperature',
    value: '0.7'
  });

  // Add OpenAI API key
  await builder.property.selectConnection(page, {
    connection: 'Add Connection'
  });
  await page.getByLabel('Name').fill('OpenAI Test Connection');
  await page.getByLabel('API Key').fill('{{secrets.OPENAI_API_KEY}}');
  await page.getByRole('button', { name: 'Save' }).click();

  // Test the flow
  await builder.testFlowAndWaitForSuccess(page);
  
  // Clean up
  await builder.clickHome(page);
  await flows.deleteFlow(page, { flowName: 'Untitled' });
});
