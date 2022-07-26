## Toast notifications

Toast notifications are using a notification service from Taiga UI. Its main objective is to display message notifications when an error action is dispatched to warn the user about an unexpected error.

To find the main example please refer to the file `/src/app/services/app.service.ts`. In this case it displays a simple text message, but this service can do more and can be used outside of error notifications.

In case you want to use it for other endeavours:

1. Inject `TuiAlertService` in your constructor

```ts
  constructor(
    ...
    @Inject(TuiAlertService)
    private readonly notificationsService: TuiAlertService
  ) {}
```

2. Launch `open()` and edit the options (TuiNotificationOptions):

```ts
this.notificationsService.open('text', options).subscribe();
```

The TaigaUI notification service accepts not only text, but also other components. Read more at: [https://taiga-ui.dev/services/alert-service](https://taiga-ui.dev/services/alert-service)
