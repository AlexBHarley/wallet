import { SessionTypes } from '@walletconnect/types-v2'
import {
  Actions as ActionsV1,
  UserActions as UserActionsV2,
  WalletConnectActions as WalletConnectActionsV2,
} from 'src/walletConnect/actions-v1'
import { Actions, UserActions, WalletConnectActions } from 'src/walletConnect/actions-v2'

export type PendingAction =
  | { isV1: true; action: any }
  | {
      isV1: false
      action: SessionTypes.RequestEvent
    }

export type Session =
  | {
      isV1: true
      session: any
    }
  | {
      isV1: false
      session: SessionTypes.Created
    }

export type PendingSession =
  | {
      isV1: true
      session: any
    }
  | {
      isV1: false
      session: SessionTypes.Proposal
    }
export interface State {
  pendingActions: PendingAction[]
  sessions: Session[]
  pendingSessions: PendingSession[]
}

const initialState: State = {
  pendingActions: [],
  sessions: [],
  pendingSessions: [],
}

export const reducer = (
  state: State | undefined = initialState,
  action: WalletConnectActions | WalletConnectActionsV2 | UserActions | UserActionsV2
): State => {
  switch (action.type) {
    // V1
    case ActionsV1.SESSION_V1:
      return {
        ...state,
        pendingSessions: [...state.pendingSessions, { isV1: true, session: action.session }],
      }
    case ActionsV1.ACCEPT_SESSION_V1:
      return {
        ...state,
        pendingSessions: state.pendingSessions.filter((s) => !s.isV1),
        sessions: [...state.sessions, { isV1: true, session: action.session }],
      }
    case ActionsV1.DENY_SESSION_V1:
      return {
        ...state,
        pendingSessions: state.pendingSessions.filter((s) => !s.isV1),
      }
    case ActionsV1.CLOSE_SESSION_V1:
      return {
        ...state,
        sessions: state.sessions.filter((s) => !s.isV1),
      }
    case ActionsV1.PAYLOAD_V1:
      return {
        ...state,
        pendingActions: [...state.pendingActions, { isV1: true, action: action.request }],
      }
    case ActionsV1.ACCEPT_REQUEST_V1:
    case ActionsV1.DENY_REQUEST_V1:
      return {
        ...state,
        pendingActions: state.pendingActions.filter((a) => a.action !== action.request),
      }

    // V2
    case Actions.SESSION_PROPOSAL:
      return {
        ...state,
        pendingSessions: [...state.pendingSessions, { isV1: false, session: action.session }],
      }

    case Actions.SESSION_CREATED:
      return {
        ...state,
        sessions: [...state.sessions, { isV1: false, session: action.session }],
      }

    case Actions.SESSION_UPDATED:
      return {
        ...state,
        sessions: state.sessions.map((s) => {
          if (s.isV1) return s
          if (s.session.topic === action.session.topic) {
            return {
              ...s,
              state: {
                ...s.session,
                accounts: action.session.state.accounts!,
              },
            }
          }
          return s
        }),
      }
    case Actions.ACCEPT_SESSION:
    case Actions.DENY_SESSION:
    case Actions.CLOSE_SESSION:
    case Actions.SESSION_DELETED:
      return {
        ...state,
        sessions: state.sessions.filter((s) => s.isV1 && s.session.topic !== action.session.topic),
        pendingSessions: state.pendingSessions.filter(
          (s) => !s.isV1 && s.session.topic !== action.session.topic
        ),
        pendingActions: state.pendingActions.filter(
          (a) => !a.isV1 && a.action.topic !== action.session.topic
        ),
      }

    case Actions.SESSION_PAYLOAD:
      return {
        ...state,
        pendingActions: [...state.pendingActions, { isV1: false, action: action.request }],
      }
    case Actions.ACCEPT_REQUEST:
    case Actions.DENY_REQUEST:
      return {
        ...state,
        pendingActions: state.pendingActions.filter(
          (a) =>
            a.isV1 === false &&
            a.action.request.id !== action.request.request.id &&
            a.action.topic !== action.request.topic
        ),
      }

    default:
      return state
  }
}
