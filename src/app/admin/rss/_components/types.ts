/**
 * Shared types and state definitions for the RSS admin page components.
 */

export type {
    RSSSource,
    RSSFeed,
    CreateFeedData,
    CreateRSSSourceData,
    UpdateRSSSourceData,
    UpdateRSSFeedData,
} from '@/services/rss';

import type { RSSSource, RSSFeed, CreateFeedData } from '@/services/rss';

// ─── Source form shape ───────────────────────────────────────────────────────

export interface SourceFormValues {
    name: string;
    websiteUrl: string;
    logoUrl: string;
    description: string;
}

export const emptySourceForm: SourceFormValues = {
    name: '',
    websiteUrl: '',
    logoUrl: '',
    description: '',
};

// ─── Feed form shape ──────────────────────────────────────────────────────────

export const emptyFeed: CreateFeedData = {
    feedUrl: '',
    categoryId: '',
    fetchInterval: 15,
    applyFilter: false,
};

// ─── Reducer state ────────────────────────────────────────────────────────────

export interface RssPageState {
    // source add modal
    isAddModalOpen: boolean;
    // source edit modal
    editingSource: RSSSource | null;
    // source delete confirm
    deleteTarget: RSSSource | null;
    // feeds management modal
    feedsModalSource: RSSSource | null;
    // feed edit modal
    editingFeed: RSSFeed | null;
    // feed delete confirm
    deleteFeedTarget: RSSFeed | null;
    // shared source form (used by both add and edit modals)
    sourceFormData: SourceFormValues;
    // list of feed rows in the "add source" modal
    newFeeds: CreateFeedData[];
    // single feed form (used by feeds modal + edit feed modal)
    feedFormData: CreateFeedData;
}

export const initialRssPageState: RssPageState = {
    isAddModalOpen: false,
    editingSource: null,
    deleteTarget: null,
    feedsModalSource: null,
    editingFeed: null,
    deleteFeedTarget: null,
    sourceFormData: emptySourceForm,
    newFeeds: [{ ...emptyFeed }],
    feedFormData: { ...emptyFeed },
};

// ─── Reducer actions ──────────────────────────────────────────────────────────

export type RssPageAction =
    // Add source modal
    | { type: 'OPEN_ADD_MODAL' }
    | { type: 'CLOSE_ADD_MODAL' }
    // Edit source modal
    | { type: 'OPEN_EDIT_SOURCE'; payload: RSSSource }
    | { type: 'CLOSE_EDIT_SOURCE' }
    // Delete source confirm
    | { type: 'SET_DELETE_SOURCE'; payload: RSSSource }
    | { type: 'CLOSE_DELETE_SOURCE' }
    // Feeds management modal
    | { type: 'OPEN_FEEDS_MODAL'; payload: RSSSource }
    | { type: 'CLOSE_FEEDS_MODAL' }
    // Edit feed modal
    | { type: 'OPEN_EDIT_FEED'; payload: RSSFeed }
    | { type: 'CLOSE_EDIT_FEED' }
    // Delete feed confirm
    | { type: 'SET_DELETE_FEED'; payload: RSSFeed }
    | { type: 'CLOSE_DELETE_FEED' }
    // Source form
    | { type: 'UPDATE_SOURCE_FORM'; payload: Partial<SourceFormValues> }
    | { type: 'RESET_SOURCE_FORM' }
    // New-feeds list (inside add-source modal)
    | { type: 'ADD_FEED_ROW' }
    | { type: 'UPDATE_FEED_ROW'; payload: { index: number; field: keyof CreateFeedData; value: CreateFeedData[keyof CreateFeedData] } }
    | { type: 'REMOVE_FEED_ROW'; payload: number }
    | { type: 'RESET_NEW_FEEDS' }
    // Feed form (feeds modal + edit feed modal)
    | { type: 'UPDATE_FEED_FORM'; payload: Partial<CreateFeedData> }
    | { type: 'RESET_FEED_FORM' };
