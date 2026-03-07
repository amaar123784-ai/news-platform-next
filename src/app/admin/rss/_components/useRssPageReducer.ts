import { useReducer } from 'react';
import {
    type RssPageState,
    type RssPageAction,
    initialRssPageState,
    emptySourceForm,
    emptyFeed,
} from './types';

function rssPageReducer(state: RssPageState, action: RssPageAction): RssPageState {
    switch (action.type) {
        // ── Add source modal ────────────────────────────────────────────────
        case 'OPEN_ADD_MODAL':
            return { ...state, isAddModalOpen: true };
        case 'CLOSE_ADD_MODAL':
            return {
                ...state,
                isAddModalOpen: false,
                sourceFormData: emptySourceForm,
                newFeeds: [{ ...emptyFeed }],
            };

        // ── Edit source modal ───────────────────────────────────────────────
        case 'OPEN_EDIT_SOURCE':
            return {
                ...state,
                editingSource: action.payload,
                sourceFormData: {
                    name: action.payload.name,
                    websiteUrl: action.payload.websiteUrl || '',
                    logoUrl: action.payload.logoUrl || '',
                    description: action.payload.description || '',
                },
            };
        case 'CLOSE_EDIT_SOURCE':
            return { ...state, editingSource: null, sourceFormData: emptySourceForm };

        // ── Delete source confirm ───────────────────────────────────────────
        case 'SET_DELETE_SOURCE':
            return { ...state, deleteTarget: action.payload };
        case 'CLOSE_DELETE_SOURCE':
            return { ...state, deleteTarget: null };

        // ── Feeds management modal ──────────────────────────────────────────
        case 'OPEN_FEEDS_MODAL':
            return {
                ...state,
                feedsModalSource: action.payload,
                feedFormData: { ...emptyFeed },
            };
        case 'CLOSE_FEEDS_MODAL':
            return { ...state, feedsModalSource: null, feedFormData: { ...emptyFeed } };

        // ── Edit feed modal ─────────────────────────────────────────────────
        case 'OPEN_EDIT_FEED':
            return {
                ...state,
                editingFeed: action.payload,
                feedFormData: {
                    feedUrl: action.payload.feedUrl,
                    categoryId: action.payload.categoryId,
                    fetchInterval: action.payload.fetchInterval,
                    applyFilter: action.payload.applyFilter,
                },
            };
        case 'CLOSE_EDIT_FEED':
            return { ...state, editingFeed: null };

        // ── Delete feed confirm ─────────────────────────────────────────────
        case 'SET_DELETE_FEED':
            return { ...state, deleteFeedTarget: action.payload };
        case 'CLOSE_DELETE_FEED':
            return { ...state, deleteFeedTarget: null };

        // ── Source form ─────────────────────────────────────────────────────
        case 'UPDATE_SOURCE_FORM':
            return { ...state, sourceFormData: { ...state.sourceFormData, ...action.payload } };
        case 'RESET_SOURCE_FORM':
            return { ...state, sourceFormData: emptySourceForm, newFeeds: [{ ...emptyFeed }] };

        // ── New feeds list ──────────────────────────────────────────────────
        case 'ADD_FEED_ROW':
            return { ...state, newFeeds: [...state.newFeeds, { ...emptyFeed }] };
        case 'UPDATE_FEED_ROW': {
            const updated = [...state.newFeeds];
            updated[action.payload.index] = {
                ...updated[action.payload.index],
                [action.payload.field]: action.payload.value,
            };
            return { ...state, newFeeds: updated };
        }
        case 'REMOVE_FEED_ROW':
            if (state.newFeeds.length <= 1) return state;
            return { ...state, newFeeds: state.newFeeds.filter((_, i) => i !== action.payload) };
        case 'RESET_NEW_FEEDS':
            return { ...state, newFeeds: [{ ...emptyFeed }] };

        // ── Feed form ───────────────────────────────────────────────────────
        case 'UPDATE_FEED_FORM':
            return { ...state, feedFormData: { ...state.feedFormData, ...action.payload } };
        case 'RESET_FEED_FORM':
            return { ...state, feedFormData: { ...emptyFeed } };

        default:
            return state;
    }
}

export function useRssPageReducer() {
    return useReducer(rssPageReducer, initialRssPageState);
}
