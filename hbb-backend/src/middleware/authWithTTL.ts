import { verifyJwt } from './verifyJwt';
import { refreshUserTTL } from './refreshUserTTL';

export const authWithTTL = [verifyJwt, refreshUserTTL];
