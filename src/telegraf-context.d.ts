import 'telegraf';
import type { Context } from 'telegraf';

export interface UserState {
  userRegistered: boolean | null;
}

export interface BotMessage {
  text?: string;
}

declare module 'telegraf' {
  interface Context {
    userState: UserState;
    botMessage: BotMessage;
  }
}
