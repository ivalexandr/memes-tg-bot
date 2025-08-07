import { ActionInterface } from '../interfaces/action.interface';

export const checkAction = (s: unknown): s is ActionInterface =>
  typeof (s as ActionInterface)?.register === 'function';
