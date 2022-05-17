export const WaitingForContextClosing = 300;

const ToastAnimationTime = 400;
export const WaitingForToastNotification =
  WaitingForContextClosing + ToastAnimationTime;

const MemberAnimationTime = 1200;
export const WaitingForMemberAnimation =
  WaitingForToastNotification + MemberAnimationTime;
