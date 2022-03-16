# Tasks Queue

To manage tasks in the background we use the tasks queue system library [Procrastinate](https://procrastinate.readthedocs.io/).

> *Procrastinate is an open-source Python 3.7+ distributed task processing library, leveraging PostgreSQL to store task definitions, manage locks and dispatch tasks. It can be used within both sync and async code.*
>
> *In other words, from your main code, you call specific functions (tasks) in a special way and instead of being run on the spot, they’re scheduled to be run elsewhere, now or in the future.*

All the code is in the package `taiga.tasksqueue`.

> **IMPORTANT:** There are three disclaimers:
> - `taiga.tasksqueue` is a wrapper over procrastinate. We implement the minimal interface according to our needs. We can extend it when required.
> - defined tasks of any package must be in a `tasks.py` file. This is necessary so that task autodiscover can find and load them when the workers are initialized.
> - our taskqueue wrapper is async by default so we change the interface regarding Procrastinate. For example: `open()` method in procrastinate is called `open_sync()` in Taiga and `open_async()` method in procrastinate is called `open()` in Taiga.

## About tasks

To define a task you have to use the decorator `Manager.task`

```python
# ...in mypackage.tasks...

from taiga.tasksqueue.manager import manager as tqmanager

@tqmanager.task
def sample_task(arg1: int, arg2: int) -> None:
    ...
```

And you have to call it like this:

```python
await sample_task.defer(1, 2)

# ...or...

sample_task.defer_sync(1, 2)
```

The decorator can receive a series of parameters that you can review at [DOC:API procrastinate.App.task](https://procrastinate.readthedocs.io/en/stable/reference.html#procrastinate.App.task).


## About scheduled tasks

We can define scheduled tasks as follows:

```python
from taiga.tasksqueue.manager import manager as tqmanager

# scheduled at the 0th minute of each hour
@tqmanager.periodic(cron="0 * * * *")
@tqmanager.task
def cleanup_foobar(timestamp: int) -> None:
    ...

# scheduled every 5 minutes
@tqmanager.periodic(cron="*/5 * * * *")
@tqmanager.task
def run_healthchecks(timestamp: int) -> None:
    ...
```

## About synch / asynch

Have in mind all tasks are asynchronous functions by default. If you need to make a call to the database from inside a task, the task should be `async`.

```python
from taiga.tasksqueue.manager import manager as tqmanager

# scheduled at the 0th minute of each hour
@tqmanager.periodic(cron="0 * * * *")
@tqmanager.task
async def cleanup_foobar(timestamp: int) -> None:
    await user_repositories.clean_users()
```

You can find more info at [DOC:Launch a task periodically](https://procrastinate.readthedocs.io/en/stable/howto/cron.html).

## About the command line

You can perform certain actions on the tasks queue system from the command line.

```bash
python -m taiga tasksqueue --help
```

- `init`: Load Taiga TasksQueue DB schema
- `shell`: Run an Administration Shell for the Taiga TasksQueue instance
- `status`: Check the state of the TasksQueue instance setup
- `worker`: Run a TasksQueue worker instance. You can increase the concurrency (`-c <num>`, default 1) or change the queue/s to listen (`-q queue1 queue2`, empty for all)


## HOWTO: Testing

There is a TestManager (`tests.utils.tasksqueue.TestTasksQueueManager`) and a fixture (`tqmanager`) to facilitate the testing of the code that uses tasks.

```python
# In some test file...

async def test_me_success(client, tqmanager):
    # (...)

    # Check if the tasksqueue is empty
    assert len(tqmanager.jobs) == 0

    # (...)

    # CHeck if the tasksqueue has...
    assert len(tqmanager.pendin_jobs) > 0
    assert len(tqmanager.finished_jobs) > 0   # failed + succeeded
    assert len(tqmanager.failed_jobs) > 0
    assert len(tqmanager.succeeded_jobs) > 0

    # Run pending jobs
    await tqmanager.run_pending_jobs()

    # (...)

    # Reset all queues
    tqmanager.reset()

    # (...)
```

`tqmanager.jobs` return a dictionary of jobs but all other `tqmanager.*_jobs` attributes return a list.

Here is a sample dict with two jobs:

```python
jobs: dict[int, JobRow] = {
    1: {
        'id': 1,
        'queue_name': 'emails',
        'task_name': 'taiga.mails.tasks.send_email',
        'lock': None,
        'queueing_lock': None,
        'args': {'email': 'test1@email.com', 'context': {}},
        'status': 'succeeded',
        'scheduled_at': None,
        'attempts': 1
    },
    2: {
        'id': 2,
        'queue_name': 'emails',
        'task_name': 'taiga.emails.tasks.send_email',
        'lock': None,
        'queueing_lock': None,
        'args': {'email': 'test2@email.com', 'context': {}},
        'status': 'todo',
        'scheduled_at': None,
        'attempts': 0
    }
}
```
