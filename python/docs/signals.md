# Signals

Signals allow certain senders to inform a set of receivers that specific actions have occurred. So a component could be able to send notification to another in a decoupled manner, minimizing dependence between two or more components.

We use the Django signals dispatcher module to have signals in Taiga.

You can find more info at [Django Documentation - Signals](https://docs.djangoproject.com/en/dev/topics/signals/)


## How to implement Signals?

First, we define some elements:

- **Signal**: An object used to notify a particular event.
- **Sender**: An object that sends the signal.
- **Receiver**: A function that will be executed when a signal is dispatched.

So, the steps to use a predefined signal are:

1. Select a predefined signal.
2. Define one or more receivers.
3. Connect the receivers with the signal.

Predefined signals are related to the ORM Model: `pre_save`, `post_save`, `pre_delete`, `post_delete` and `m2m_changed` are some of them. You can find a complete and detailed list in the [Django Documentation about predefined signals](https://docs.djangoproject.com/en/dev/ref/signals/).

If we want to use a custom signal, we follow these steps:

1. Define a signal.
2. Send signals from any component.
3. Define one or more receivers.
4. Connect the receivers with the signal.