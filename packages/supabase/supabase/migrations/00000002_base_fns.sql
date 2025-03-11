-- Migration: 00000002_base_fns.sql
-- This migration adds some common functions used across the database.
-- Function: trigger_set_timestamp
-- Automatically sets the updated_at column to the current UTC time
CREATE
OR REPLACE FUNCTION public.trigger_set_timestamp() RETURNS trigger LANGUAGE plpgsql AS $ $ BEGIN NEW.updated_at = timezone('utc' :: text, now());

RETURN NEW;

END;

$ $;