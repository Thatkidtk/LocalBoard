export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      comment_votes: {
        Row: {
          comment_id: string;
          created_at: string;
          updated_at: string;
          user_id: string;
          value: number;
        };
        Insert: {
          comment_id: string;
          user_id: string;
          value: number;
        };
        Update: {
          value?: number;
        };
      };
      comments: {
        Row: {
          author_id: string;
          body: string;
          created_at: string;
          deleted_at: string | null;
          deleted_by: string | null;
          depth: number;
          id: string;
          parent_comment_id: string | null;
          post_id: string;
          score: number;
          updated_at: string;
        };
        Insert: {
          author_id: string;
          body: string;
          parent_comment_id?: string | null;
          post_id: string;
        };
        Update: {
          body?: string;
          deleted_at?: string | null;
          deleted_by?: string | null;
          score?: number;
          updated_at?: string;
        };
      };
      communities: {
        Row: {
          city: string;
          created_at: string;
          description: string | null;
          id: string;
          latitude: number;
          longitude: number;
          name: string;
          slug: string;
          state_code: string;
          zip_code: string;
        };
        Insert: {
          city: string;
          description?: string | null;
          latitude: number;
          longitude: number;
          name: string;
          slug: string;
          state_code: string;
          zip_code: string;
        };
        Update: {
          description?: string | null;
          name?: string;
        };
      };
      community_neighbors: {
        Row: {
          community_id: string;
          distance_miles: number;
          nearby_community_id: string;
        };
        Insert: {
          community_id: string;
          distance_miles: number;
          nearby_community_id: string;
        };
        Update: {
          distance_miles?: number;
        };
      };
      moderation_actions: {
        Row: {
          action: string;
          created_at: string;
          id: string;
          moderator_id: string;
          note: string | null;
          report_id: string | null;
          target_id: string | null;
          target_type: string | null;
        };
        Insert: {
          action: string;
          moderator_id: string;
          note?: string | null;
          report_id?: string | null;
          target_id?: string | null;
          target_type?: string | null;
        };
        Update: {
          note?: string | null;
        };
      };
      notifications: {
        Row: {
          actor_id: string | null;
          comment_id: string | null;
          community_id: string | null;
          created_at: string;
          dedupe_key: string | null;
          id: string;
          message: string;
          post_id: string | null;
          read_at: string | null;
          type: string;
          user_id: string;
        };
        Insert: {
          actor_id?: string | null;
          comment_id?: string | null;
          community_id?: string | null;
          dedupe_key?: string | null;
          message: string;
          post_id?: string | null;
          read_at?: string | null;
          type: string;
          user_id: string;
        };
        Update: {
          read_at?: string | null;
        };
      };
      post_votes: {
        Row: {
          created_at: string;
          post_id: string;
          updated_at: string;
          user_id: string;
          value: number;
        };
        Insert: {
          post_id: string;
          user_id: string;
          value: number;
        };
        Update: {
          value?: number;
        };
      };
      posts: {
        Row: {
          author_id: string;
          body: string;
          category: string;
          comment_count: number;
          community_id: string;
          created_at: string;
          deleted_at: string | null;
          deleted_by: string | null;
          hot_score: number;
          id: string;
          score: number;
          search_document: string | null;
          title: string;
          updated_at: string;
        };
        Insert: {
          author_id: string;
          body: string;
          category: string;
          community_id: string;
          title: string;
        };
        Update: {
          body?: string;
          category?: string;
          deleted_at?: string | null;
          deleted_by?: string | null;
          hot_score?: number;
          score?: number;
          search_document?: string | null;
          title?: string;
          updated_at?: string;
        };
      };
      profiles: {
        Row: {
          avatar_path: string | null;
          created_at: string;
          home_community_id: string | null;
          id: string;
          is_suspended: boolean;
          karma: number;
          role: string;
          updated_at: string;
          username: string;
        };
        Insert: {
          avatar_path?: string | null;
          home_community_id?: string | null;
          id: string;
          is_suspended?: boolean;
          karma?: number;
          role?: string;
          username: string;
        };
        Update: {
          avatar_path?: string | null;
          home_community_id?: string | null;
          is_suspended?: boolean;
          karma?: number;
          role?: string;
          username?: string;
        };
      };
      reports: {
        Row: {
          created_at: string;
          details: string | null;
          id: string;
          reason: string;
          reporter_id: string;
          reviewer_id: string | null;
          status: string;
          target_id: string;
          target_type: string;
          updated_at: string;
        };
        Insert: {
          details?: string | null;
          reason: string;
          reporter_id: string;
          reviewer_id?: string | null;
          status?: string;
          target_id: string;
          target_type: string;
        };
        Update: {
          details?: string | null;
          reviewer_id?: string | null;
          status?: string;
          updated_at?: string;
        };
      };
    };
    Functions: {
      toggle_comment_vote: {
        Args: {
          target_comment_id: string;
          incoming_vote: number;
        };
        Returns: number;
      };
      toggle_post_vote: {
        Args: {
          target_post_id: string;
          incoming_vote: number;
        };
        Returns: number;
      };
    };
  };
}
