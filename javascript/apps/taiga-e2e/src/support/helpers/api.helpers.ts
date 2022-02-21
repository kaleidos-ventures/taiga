/* eslint-disable */
import { Auth } from '@taiga/data';
import config from '~/assets/config.json';

export function request<T>(
  method: string,
  path: string,
  body: Cypress.RequestBody | undefined,
  options: Partial<Cypress.RequestOptions> = {}
): Promise<Cypress.Response<T>> {
  return new Promise((resolve) => {
    cy.window().then((window) => {
      const authStorage = window.localStorage.getItem('auth');

      if (authStorage) {
        const auth = JSON.parse(authStorage) as Auth;

        cy.request({
          method,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          url: `${config.api}${path}`,
          body,
          auth: {
            bearer: auth.token,
          },
          ...options,
        }).then(resolve);
      }
    });
  });
}
/* eslint-enable */
