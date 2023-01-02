PGDMP  	    0        	             {            taiga    12.3 (Debian 12.3-1.pgdg100+1)    13.6 �              0    0    ENCODING    ENCODING        SET client_encoding = 'UTF8';
                      false                       0    0 
   STDSTRINGS 
   STDSTRINGS     (   SET standard_conforming_strings = 'on';
                      false                       0    0 
   SEARCHPATH 
   SEARCHPATH     8   SELECT pg_catalog.set_config('search_path', '', false);
                      false                        1262    7770682    taiga    DATABASE     Y   CREATE DATABASE taiga WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE = 'en_US.utf8';
    DROP DATABASE taiga;
                taiga    false                        3079    7770809    unaccent 	   EXTENSION     <   CREATE EXTENSION IF NOT EXISTS unaccent WITH SCHEMA public;
    DROP EXTENSION unaccent;
                   false            !           0    0    EXTENSION unaccent    COMMENT     P   COMMENT ON EXTENSION unaccent IS 'text search dictionary that removes accents';
                        false    2            a           1247    7771194    procrastinate_job_event_type    TYPE     �   CREATE TYPE public.procrastinate_job_event_type AS ENUM (
    'deferred',
    'started',
    'deferred_for_retry',
    'failed',
    'succeeded',
    'cancelled',
    'scheduled'
);
 /   DROP TYPE public.procrastinate_job_event_type;
       public          taiga    false            ^           1247    7771184    procrastinate_job_status    TYPE     p   CREATE TYPE public.procrastinate_job_status AS ENUM (
    'todo',
    'doing',
    'succeeded',
    'failed'
);
 +   DROP TYPE public.procrastinate_job_status;
       public          taiga    false            K           1255    7771259 j   procrastinate_defer_job(character varying, character varying, text, text, jsonb, timestamp with time zone)    FUNCTION     �  CREATE FUNCTION public.procrastinate_defer_job(queue_name character varying, task_name character varying, lock text, queueing_lock text, args jsonb, scheduled_at timestamp with time zone) RETURNS bigint
    LANGUAGE plpgsql
    AS $$
DECLARE
	job_id bigint;
BEGIN
    INSERT INTO procrastinate_jobs (queue_name, task_name, lock, queueing_lock, args, scheduled_at)
    VALUES (queue_name, task_name, lock, queueing_lock, args, scheduled_at)
    RETURNING id INTO job_id;

    RETURN job_id;
END;
$$;
 �   DROP FUNCTION public.procrastinate_defer_job(queue_name character varying, task_name character varying, lock text, queueing_lock text, args jsonb, scheduled_at timestamp with time zone);
       public          taiga    false            c           1255    7771276 t   procrastinate_defer_periodic_job(character varying, character varying, character varying, character varying, bigint)    FUNCTION     �  CREATE FUNCTION public.procrastinate_defer_periodic_job(_queue_name character varying, _lock character varying, _queueing_lock character varying, _task_name character varying, _defer_timestamp bigint) RETURNS bigint
    LANGUAGE plpgsql
    AS $$
DECLARE
	_job_id bigint;
	_defer_id bigint;
BEGIN

    INSERT
        INTO procrastinate_periodic_defers (task_name, queue_name, defer_timestamp)
        VALUES (_task_name, _queue_name, _defer_timestamp)
        ON CONFLICT DO NOTHING
        RETURNING id into _defer_id;

    IF _defer_id IS NULL THEN
        RETURN NULL;
    END IF;

    UPDATE procrastinate_periodic_defers
        SET job_id = procrastinate_defer_job(
                _queue_name,
                _task_name,
                _lock,
                _queueing_lock,
                ('{"timestamp": ' || _defer_timestamp || '}')::jsonb,
                NULL
            )
        WHERE id = _defer_id
        RETURNING job_id INTO _job_id;

    DELETE
        FROM procrastinate_periodic_defers
        USING (
            SELECT id
            FROM procrastinate_periodic_defers
            WHERE procrastinate_periodic_defers.task_name = _task_name
            AND procrastinate_periodic_defers.queue_name = _queue_name
            AND procrastinate_periodic_defers.defer_timestamp < _defer_timestamp
            ORDER BY id
            FOR UPDATE
        ) to_delete
        WHERE procrastinate_periodic_defers.id = to_delete.id;

    RETURN _job_id;
END;
$$;
 �   DROP FUNCTION public.procrastinate_defer_periodic_job(_queue_name character varying, _lock character varying, _queueing_lock character varying, _task_name character varying, _defer_timestamp bigint);
       public          taiga    false            L           1255    7771260 �   procrastinate_defer_periodic_job(character varying, character varying, character varying, character varying, character varying, bigint, jsonb)    FUNCTION     �  CREATE FUNCTION public.procrastinate_defer_periodic_job(_queue_name character varying, _lock character varying, _queueing_lock character varying, _task_name character varying, _periodic_id character varying, _defer_timestamp bigint, _args jsonb) RETURNS bigint
    LANGUAGE plpgsql
    AS $$
DECLARE
	_job_id bigint;
	_defer_id bigint;
BEGIN

    INSERT
        INTO procrastinate_periodic_defers (task_name, periodic_id, defer_timestamp)
        VALUES (_task_name, _periodic_id, _defer_timestamp)
        ON CONFLICT DO NOTHING
        RETURNING id into _defer_id;

    IF _defer_id IS NULL THEN
        RETURN NULL;
    END IF;

    UPDATE procrastinate_periodic_defers
        SET job_id = procrastinate_defer_job(
                _queue_name,
                _task_name,
                _lock,
                _queueing_lock,
                _args,
                NULL
            )
        WHERE id = _defer_id
        RETURNING job_id INTO _job_id;

    DELETE
        FROM procrastinate_periodic_defers
        USING (
            SELECT id
            FROM procrastinate_periodic_defers
            WHERE procrastinate_periodic_defers.task_name = _task_name
            AND procrastinate_periodic_defers.periodic_id = _periodic_id
            AND procrastinate_periodic_defers.defer_timestamp < _defer_timestamp
            ORDER BY id
            FOR UPDATE
        ) to_delete
        WHERE procrastinate_periodic_defers.id = to_delete.id;

    RETURN _job_id;
END;
$$;
 �   DROP FUNCTION public.procrastinate_defer_periodic_job(_queue_name character varying, _lock character varying, _queueing_lock character varying, _task_name character varying, _periodic_id character varying, _defer_timestamp bigint, _args jsonb);
       public          taiga    false            �            1259    7771211    procrastinate_jobs    TABLE     �  CREATE TABLE public.procrastinate_jobs (
    id bigint NOT NULL,
    queue_name character varying(128) NOT NULL,
    task_name character varying(128) NOT NULL,
    lock text,
    queueing_lock text,
    args jsonb DEFAULT '{}'::jsonb NOT NULL,
    status public.procrastinate_job_status DEFAULT 'todo'::public.procrastinate_job_status NOT NULL,
    scheduled_at timestamp with time zone,
    attempts integer DEFAULT 0 NOT NULL
);
 &   DROP TABLE public.procrastinate_jobs;
       public         heap    taiga    false    862    862            M           1255    7771261 ,   procrastinate_fetch_job(character varying[])    FUNCTION     	  CREATE FUNCTION public.procrastinate_fetch_job(target_queue_names character varying[]) RETURNS public.procrastinate_jobs
    LANGUAGE plpgsql
    AS $$
DECLARE
	found_jobs procrastinate_jobs;
BEGIN
    WITH candidate AS (
        SELECT jobs.*
            FROM procrastinate_jobs AS jobs
            WHERE
                -- reject the job if its lock has earlier jobs
                NOT EXISTS (
                    SELECT 1
                        FROM procrastinate_jobs AS earlier_jobs
                        WHERE
                            jobs.lock IS NOT NULL
                            AND earlier_jobs.lock = jobs.lock
                            AND earlier_jobs.status IN ('todo', 'doing')
                            AND earlier_jobs.id < jobs.id)
                AND jobs.status = 'todo'
                AND (target_queue_names IS NULL OR jobs.queue_name = ANY( target_queue_names ))
                AND (jobs.scheduled_at IS NULL OR jobs.scheduled_at <= now())
            ORDER BY jobs.id ASC LIMIT 1
            FOR UPDATE OF jobs SKIP LOCKED
    )
    UPDATE procrastinate_jobs
        SET status = 'doing'
        FROM candidate
        WHERE procrastinate_jobs.id = candidate.id
        RETURNING procrastinate_jobs.* INTO found_jobs;

	RETURN found_jobs;
END;
$$;
 V   DROP FUNCTION public.procrastinate_fetch_job(target_queue_names character varying[]);
       public          taiga    false    239            b           1255    7771275 B   procrastinate_finish_job(integer, public.procrastinate_job_status)    FUNCTION       CREATE FUNCTION public.procrastinate_finish_job(job_id integer, end_status public.procrastinate_job_status) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
    UPDATE procrastinate_jobs
    SET status = end_status,
        attempts = attempts + 1
    WHERE id = job_id;
END;
$$;
 k   DROP FUNCTION public.procrastinate_finish_job(job_id integer, end_status public.procrastinate_job_status);
       public          taiga    false    862            a           1255    7771274 \   procrastinate_finish_job(integer, public.procrastinate_job_status, timestamp with time zone)    FUNCTION     �  CREATE FUNCTION public.procrastinate_finish_job(job_id integer, end_status public.procrastinate_job_status, next_scheduled_at timestamp with time zone) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
    UPDATE procrastinate_jobs
    SET status = end_status,
        attempts = attempts + 1,
        scheduled_at = COALESCE(next_scheduled_at, scheduled_at)
    WHERE id = job_id;
END;
$$;
 �   DROP FUNCTION public.procrastinate_finish_job(job_id integer, end_status public.procrastinate_job_status, next_scheduled_at timestamp with time zone);
       public          taiga    false    862            N           1255    7771262 e   procrastinate_finish_job(integer, public.procrastinate_job_status, timestamp with time zone, boolean)    FUNCTION       CREATE FUNCTION public.procrastinate_finish_job(job_id integer, end_status public.procrastinate_job_status, next_scheduled_at timestamp with time zone, delete_job boolean) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
    _job_id bigint;
BEGIN
    IF end_status NOT IN ('succeeded', 'failed') THEN
        RAISE 'End status should be either "succeeded" or "failed" (job id: %)', job_id;
    END IF;
    IF delete_job THEN
        DELETE FROM procrastinate_jobs
        WHERE id = job_id AND status IN ('todo', 'doing')
        RETURNING id INTO _job_id;
    ELSE
        UPDATE procrastinate_jobs
        SET status = end_status,
            attempts =
                CASE
                    WHEN status = 'doing' THEN attempts + 1
                    ELSE attempts
                END
        WHERE id = job_id AND status IN ('todo', 'doing')
        RETURNING id INTO _job_id;
    END IF;
    IF _job_id IS NULL THEN
        RAISE 'Job was not found or not in "doing" or "todo" status (job id: %)', job_id;
    END IF;
END;
$$;
 �   DROP FUNCTION public.procrastinate_finish_job(job_id integer, end_status public.procrastinate_job_status, next_scheduled_at timestamp with time zone, delete_job boolean);
       public          taiga    false    862            P           1255    7771264    procrastinate_notify_queue()    FUNCTION     
  CREATE FUNCTION public.procrastinate_notify_queue() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
	PERFORM pg_notify('procrastinate_queue#' || NEW.queue_name, NEW.task_name);
	PERFORM pg_notify('procrastinate_any_queue', NEW.task_name);
	RETURN NEW;
END;
$$;
 3   DROP FUNCTION public.procrastinate_notify_queue();
       public          taiga    false            O           1255    7771263 :   procrastinate_retry_job(integer, timestamp with time zone)    FUNCTION     �  CREATE FUNCTION public.procrastinate_retry_job(job_id integer, retry_at timestamp with time zone) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
    _job_id bigint;
BEGIN
    UPDATE procrastinate_jobs
    SET status = 'todo',
        attempts = attempts + 1,
        scheduled_at = retry_at
    WHERE id = job_id AND status = 'doing'
    RETURNING id INTO _job_id;
    IF _job_id IS NULL THEN
        RAISE 'Job was not found or not in "doing" status (job id: %)', job_id;
    END IF;
END;
$$;
 a   DROP FUNCTION public.procrastinate_retry_job(job_id integer, retry_at timestamp with time zone);
       public          taiga    false            _           1255    7771267 2   procrastinate_trigger_scheduled_events_procedure()    FUNCTION     #  CREATE FUNCTION public.procrastinate_trigger_scheduled_events_procedure() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    INSERT INTO procrastinate_events(job_id, type, at)
        VALUES (NEW.id, 'scheduled'::procrastinate_job_event_type, NEW.scheduled_at);

	RETURN NEW;
END;
$$;
 I   DROP FUNCTION public.procrastinate_trigger_scheduled_events_procedure();
       public          taiga    false            ]           1255    7771265 6   procrastinate_trigger_status_events_procedure_insert()    FUNCTION       CREATE FUNCTION public.procrastinate_trigger_status_events_procedure_insert() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    INSERT INTO procrastinate_events(job_id, type)
        VALUES (NEW.id, 'deferred'::procrastinate_job_event_type);
	RETURN NEW;
END;
$$;
 M   DROP FUNCTION public.procrastinate_trigger_status_events_procedure_insert();
       public          taiga    false            ^           1255    7771266 6   procrastinate_trigger_status_events_procedure_update()    FUNCTION     �  CREATE FUNCTION public.procrastinate_trigger_status_events_procedure_update() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    WITH t AS (
        SELECT CASE
            WHEN OLD.status = 'todo'::procrastinate_job_status
                AND NEW.status = 'doing'::procrastinate_job_status
                THEN 'started'::procrastinate_job_event_type
            WHEN OLD.status = 'doing'::procrastinate_job_status
                AND NEW.status = 'todo'::procrastinate_job_status
                THEN 'deferred_for_retry'::procrastinate_job_event_type
            WHEN OLD.status = 'doing'::procrastinate_job_status
                AND NEW.status = 'failed'::procrastinate_job_status
                THEN 'failed'::procrastinate_job_event_type
            WHEN OLD.status = 'doing'::procrastinate_job_status
                AND NEW.status = 'succeeded'::procrastinate_job_status
                THEN 'succeeded'::procrastinate_job_event_type
            WHEN OLD.status = 'todo'::procrastinate_job_status
                AND (
                    NEW.status = 'failed'::procrastinate_job_status
                    OR NEW.status = 'succeeded'::procrastinate_job_status
                )
                THEN 'cancelled'::procrastinate_job_event_type
            ELSE NULL
        END as event_type
    )
    INSERT INTO procrastinate_events(job_id, type)
        SELECT NEW.id, t.event_type
        FROM t
        WHERE t.event_type IS NOT NULL;
	RETURN NEW;
END;
$$;
 M   DROP FUNCTION public.procrastinate_trigger_status_events_procedure_update();
       public          taiga    false            `           1255    7771268 &   procrastinate_unlink_periodic_defers()    FUNCTION     �   CREATE FUNCTION public.procrastinate_unlink_periodic_defers() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    UPDATE procrastinate_periodic_defers
    SET job_id = NULL
    WHERE job_id = OLD.id;
    RETURN OLD;
END;
$$;
 =   DROP FUNCTION public.procrastinate_unlink_periodic_defers();
       public          taiga    false            �           3602    7770816    simple_unaccent    TEXT SEARCH CONFIGURATION     �  CREATE TEXT SEARCH CONFIGURATION public.simple_unaccent (
    PARSER = pg_catalog."default" );

ALTER TEXT SEARCH CONFIGURATION public.simple_unaccent
    ADD MAPPING FOR asciiword WITH simple;

ALTER TEXT SEARCH CONFIGURATION public.simple_unaccent
    ADD MAPPING FOR word WITH public.unaccent, simple;

ALTER TEXT SEARCH CONFIGURATION public.simple_unaccent
    ADD MAPPING FOR numword WITH simple;

ALTER TEXT SEARCH CONFIGURATION public.simple_unaccent
    ADD MAPPING FOR email WITH simple;

ALTER TEXT SEARCH CONFIGURATION public.simple_unaccent
    ADD MAPPING FOR url WITH simple;

ALTER TEXT SEARCH CONFIGURATION public.simple_unaccent
    ADD MAPPING FOR host WITH simple;

ALTER TEXT SEARCH CONFIGURATION public.simple_unaccent
    ADD MAPPING FOR sfloat WITH simple;

ALTER TEXT SEARCH CONFIGURATION public.simple_unaccent
    ADD MAPPING FOR version WITH simple;

ALTER TEXT SEARCH CONFIGURATION public.simple_unaccent
    ADD MAPPING FOR hword_numpart WITH simple;

ALTER TEXT SEARCH CONFIGURATION public.simple_unaccent
    ADD MAPPING FOR hword_part WITH public.unaccent, simple;

ALTER TEXT SEARCH CONFIGURATION public.simple_unaccent
    ADD MAPPING FOR hword_asciipart WITH simple;

ALTER TEXT SEARCH CONFIGURATION public.simple_unaccent
    ADD MAPPING FOR numhword WITH simple;

ALTER TEXT SEARCH CONFIGURATION public.simple_unaccent
    ADD MAPPING FOR asciihword WITH simple;

ALTER TEXT SEARCH CONFIGURATION public.simple_unaccent
    ADD MAPPING FOR hword WITH public.unaccent, simple;

ALTER TEXT SEARCH CONFIGURATION public.simple_unaccent
    ADD MAPPING FOR url_path WITH simple;

ALTER TEXT SEARCH CONFIGURATION public.simple_unaccent
    ADD MAPPING FOR file WITH simple;

ALTER TEXT SEARCH CONFIGURATION public.simple_unaccent
    ADD MAPPING FOR "float" WITH simple;

ALTER TEXT SEARCH CONFIGURATION public.simple_unaccent
    ADD MAPPING FOR "int" WITH simple;

ALTER TEXT SEARCH CONFIGURATION public.simple_unaccent
    ADD MAPPING FOR uint WITH simple;
 7   DROP TEXT SEARCH CONFIGURATION public.simple_unaccent;
       public          taiga    false    2    2    2    2            �            1259    7770769 
   auth_group    TABLE     f   CREATE TABLE public.auth_group (
    id integer NOT NULL,
    name character varying(150) NOT NULL
);
    DROP TABLE public.auth_group;
       public         heap    taiga    false            �            1259    7770767    auth_group_id_seq    SEQUENCE     �   ALTER TABLE public.auth_group ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.auth_group_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);
            public          taiga    false    214            �            1259    7770778    auth_group_permissions    TABLE     �   CREATE TABLE public.auth_group_permissions (
    id bigint NOT NULL,
    group_id integer NOT NULL,
    permission_id integer NOT NULL
);
 *   DROP TABLE public.auth_group_permissions;
       public         heap    taiga    false            �            1259    7770776    auth_group_permissions_id_seq    SEQUENCE     �   ALTER TABLE public.auth_group_permissions ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.auth_group_permissions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);
            public          taiga    false    216            �            1259    7770762    auth_permission    TABLE     �   CREATE TABLE public.auth_permission (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    content_type_id integer NOT NULL,
    codename character varying(100) NOT NULL
);
 #   DROP TABLE public.auth_permission;
       public         heap    taiga    false            �            1259    7770760    auth_permission_id_seq    SEQUENCE     �   ALTER TABLE public.auth_permission ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.auth_permission_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);
            public          taiga    false    212            �            1259    7770739    django_admin_log    TABLE     �  CREATE TABLE public.django_admin_log (
    id integer NOT NULL,
    action_time timestamp with time zone NOT NULL,
    object_id text,
    object_repr character varying(200) NOT NULL,
    action_flag smallint NOT NULL,
    change_message text NOT NULL,
    content_type_id integer,
    user_id uuid NOT NULL,
    CONSTRAINT django_admin_log_action_flag_check CHECK ((action_flag >= 0))
);
 $   DROP TABLE public.django_admin_log;
       public         heap    taiga    false            �            1259    7770737    django_admin_log_id_seq    SEQUENCE     �   ALTER TABLE public.django_admin_log ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.django_admin_log_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);
            public          taiga    false    210            �            1259    7770730    django_content_type    TABLE     �   CREATE TABLE public.django_content_type (
    id integer NOT NULL,
    app_label character varying(100) NOT NULL,
    model character varying(100) NOT NULL
);
 '   DROP TABLE public.django_content_type;
       public         heap    taiga    false            �            1259    7770728    django_content_type_id_seq    SEQUENCE     �   ALTER TABLE public.django_content_type ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.django_content_type_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);
            public          taiga    false    208            �            1259    7770685    django_migrations    TABLE     �   CREATE TABLE public.django_migrations (
    id bigint NOT NULL,
    app character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    applied timestamp with time zone NOT NULL
);
 %   DROP TABLE public.django_migrations;
       public         heap    taiga    false            �            1259    7770683    django_migrations_id_seq    SEQUENCE     �   ALTER TABLE public.django_migrations ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.django_migrations_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);
            public          taiga    false    204            �            1259    7770996    django_session    TABLE     �   CREATE TABLE public.django_session (
    session_key character varying(40) NOT NULL,
    session_data text NOT NULL,
    expire_date timestamp with time zone NOT NULL
);
 "   DROP TABLE public.django_session;
       public         heap    taiga    false            �            1259    7770819    easy_thumbnails_source    TABLE     �   CREATE TABLE public.easy_thumbnails_source (
    id integer NOT NULL,
    storage_hash character varying(40) NOT NULL,
    name character varying(255) NOT NULL,
    modified timestamp with time zone NOT NULL
);
 *   DROP TABLE public.easy_thumbnails_source;
       public         heap    taiga    false            �            1259    7770817    easy_thumbnails_source_id_seq    SEQUENCE     �   ALTER TABLE public.easy_thumbnails_source ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.easy_thumbnails_source_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);
            public          taiga    false    218            �            1259    7770826    easy_thumbnails_thumbnail    TABLE     �   CREATE TABLE public.easy_thumbnails_thumbnail (
    id integer NOT NULL,
    storage_hash character varying(40) NOT NULL,
    name character varying(255) NOT NULL,
    modified timestamp with time zone NOT NULL,
    source_id integer NOT NULL
);
 -   DROP TABLE public.easy_thumbnails_thumbnail;
       public         heap    taiga    false            �            1259    7770824     easy_thumbnails_thumbnail_id_seq    SEQUENCE     �   ALTER TABLE public.easy_thumbnails_thumbnail ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.easy_thumbnails_thumbnail_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);
            public          taiga    false    220            �            1259    7770851 #   easy_thumbnails_thumbnaildimensions    TABLE     K  CREATE TABLE public.easy_thumbnails_thumbnaildimensions (
    id integer NOT NULL,
    thumbnail_id integer NOT NULL,
    width integer,
    height integer,
    CONSTRAINT easy_thumbnails_thumbnaildimensions_height_check CHECK ((height >= 0)),
    CONSTRAINT easy_thumbnails_thumbnaildimensions_width_check CHECK ((width >= 0))
);
 7   DROP TABLE public.easy_thumbnails_thumbnaildimensions;
       public         heap    taiga    false            �            1259    7770849 *   easy_thumbnails_thumbnaildimensions_id_seq    SEQUENCE       ALTER TABLE public.easy_thumbnails_thumbnaildimensions ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.easy_thumbnails_thumbnaildimensions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);
            public          taiga    false    222            �            1259    7771241    procrastinate_events    TABLE     �   CREATE TABLE public.procrastinate_events (
    id bigint NOT NULL,
    job_id integer NOT NULL,
    type public.procrastinate_job_event_type,
    at timestamp with time zone DEFAULT now()
);
 (   DROP TABLE public.procrastinate_events;
       public         heap    taiga    false    865            �            1259    7771239    procrastinate_events_id_seq    SEQUENCE     �   CREATE SEQUENCE public.procrastinate_events_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 2   DROP SEQUENCE public.procrastinate_events_id_seq;
       public          taiga    false    243            "           0    0    procrastinate_events_id_seq    SEQUENCE OWNED BY     [   ALTER SEQUENCE public.procrastinate_events_id_seq OWNED BY public.procrastinate_events.id;
          public          taiga    false    242            �            1259    7771209    procrastinate_jobs_id_seq    SEQUENCE     �   CREATE SEQUENCE public.procrastinate_jobs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 0   DROP SEQUENCE public.procrastinate_jobs_id_seq;
       public          taiga    false    239            #           0    0    procrastinate_jobs_id_seq    SEQUENCE OWNED BY     W   ALTER SEQUENCE public.procrastinate_jobs_id_seq OWNED BY public.procrastinate_jobs.id;
          public          taiga    false    238            �            1259    7771225    procrastinate_periodic_defers    TABLE     "  CREATE TABLE public.procrastinate_periodic_defers (
    id bigint NOT NULL,
    task_name character varying(128) NOT NULL,
    defer_timestamp bigint,
    job_id bigint,
    queue_name character varying(128),
    periodic_id character varying(128) DEFAULT ''::character varying NOT NULL
);
 1   DROP TABLE public.procrastinate_periodic_defers;
       public         heap    taiga    false            �            1259    7771223 $   procrastinate_periodic_defers_id_seq    SEQUENCE     �   CREATE SEQUENCE public.procrastinate_periodic_defers_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 ;   DROP SEQUENCE public.procrastinate_periodic_defers_id_seq;
       public          taiga    false    241            $           0    0 $   procrastinate_periodic_defers_id_seq    SEQUENCE OWNED BY     m   ALTER SEQUENCE public.procrastinate_periodic_defers_id_seq OWNED BY public.procrastinate_periodic_defers.id;
          public          taiga    false    240            �            1259    7771277 3   project_references_77e98d528c0211ed921d98fa9b3ac69a    SEQUENCE     �   CREATE SEQUENCE public.project_references_77e98d528c0211ed921d98fa9b3ac69a
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 J   DROP SEQUENCE public.project_references_77e98d528c0211ed921d98fa9b3ac69a;
       public          taiga    false            �            1259    7771279 3   project_references_77f3ab7a8c0211ed921d98fa9b3ac69a    SEQUENCE     �   CREATE SEQUENCE public.project_references_77f3ab7a8c0211ed921d98fa9b3ac69a
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 J   DROP SEQUENCE public.project_references_77f3ab7a8c0211ed921d98fa9b3ac69a;
       public          taiga    false            �            1259    7771281 3   project_references_77fe003e8c0211ed921d98fa9b3ac69a    SEQUENCE     �   CREATE SEQUENCE public.project_references_77fe003e8c0211ed921d98fa9b3ac69a
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 J   DROP SEQUENCE public.project_references_77fe003e8c0211ed921d98fa9b3ac69a;
       public          taiga    false            �            1259    7771283 3   project_references_7804bbd68c0211ed921d98fa9b3ac69a    SEQUENCE     �   CREATE SEQUENCE public.project_references_7804bbd68c0211ed921d98fa9b3ac69a
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 J   DROP SEQUENCE public.project_references_7804bbd68c0211ed921d98fa9b3ac69a;
       public          taiga    false            �            1259    7771285 3   project_references_780b5ba88c0211ed921d98fa9b3ac69a    SEQUENCE     �   CREATE SEQUENCE public.project_references_780b5ba88c0211ed921d98fa9b3ac69a
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 J   DROP SEQUENCE public.project_references_780b5ba88c0211ed921d98fa9b3ac69a;
       public          taiga    false            �            1259    7771287 3   project_references_78145e2e8c0211ed921d98fa9b3ac69a    SEQUENCE     �   CREATE SEQUENCE public.project_references_78145e2e8c0211ed921d98fa9b3ac69a
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 J   DROP SEQUENCE public.project_references_78145e2e8c0211ed921d98fa9b3ac69a;
       public          taiga    false            �            1259    7771289 3   project_references_781de1b08c0211ed921d98fa9b3ac69a    SEQUENCE     �   CREATE SEQUENCE public.project_references_781de1b08c0211ed921d98fa9b3ac69a
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 J   DROP SEQUENCE public.project_references_781de1b08c0211ed921d98fa9b3ac69a;
       public          taiga    false            �            1259    7771291 3   project_references_782762da8c0211ed921d98fa9b3ac69a    SEQUENCE     �   CREATE SEQUENCE public.project_references_782762da8c0211ed921d98fa9b3ac69a
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 J   DROP SEQUENCE public.project_references_782762da8c0211ed921d98fa9b3ac69a;
       public          taiga    false            �            1259    7771293 3   project_references_782e250c8c0211ed921d98fa9b3ac69a    SEQUENCE     �   CREATE SEQUENCE public.project_references_782e250c8c0211ed921d98fa9b3ac69a
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 J   DROP SEQUENCE public.project_references_782e250c8c0211ed921d98fa9b3ac69a;
       public          taiga    false            �            1259    7771295 3   project_references_783930dc8c0211ed921d98fa9b3ac69a    SEQUENCE     �   CREATE SEQUENCE public.project_references_783930dc8c0211ed921d98fa9b3ac69a
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 J   DROP SEQUENCE public.project_references_783930dc8c0211ed921d98fa9b3ac69a;
       public          taiga    false            �            1259    7771297 3   project_references_784135528c0211ed921d98fa9b3ac69a    SEQUENCE     �   CREATE SEQUENCE public.project_references_784135528c0211ed921d98fa9b3ac69a
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 J   DROP SEQUENCE public.project_references_784135528c0211ed921d98fa9b3ac69a;
       public          taiga    false            �            1259    7771299 3   project_references_784cacc08c0211ed921d98fa9b3ac69a    SEQUENCE     �   CREATE SEQUENCE public.project_references_784cacc08c0211ed921d98fa9b3ac69a
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 J   DROP SEQUENCE public.project_references_784cacc08c0211ed921d98fa9b3ac69a;
       public          taiga    false                        1259    7771301 3   project_references_78550f3c8c0211ed921d98fa9b3ac69a    SEQUENCE     �   CREATE SEQUENCE public.project_references_78550f3c8c0211ed921d98fa9b3ac69a
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 J   DROP SEQUENCE public.project_references_78550f3c8c0211ed921d98fa9b3ac69a;
       public          taiga    false                       1259    7771303 3   project_references_785dc08c8c0211ed921d98fa9b3ac69a    SEQUENCE     �   CREATE SEQUENCE public.project_references_785dc08c8c0211ed921d98fa9b3ac69a
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 J   DROP SEQUENCE public.project_references_785dc08c8c0211ed921d98fa9b3ac69a;
       public          taiga    false                       1259    7771305 3   project_references_786475088c0211ed921d98fa9b3ac69a    SEQUENCE     �   CREATE SEQUENCE public.project_references_786475088c0211ed921d98fa9b3ac69a
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 J   DROP SEQUENCE public.project_references_786475088c0211ed921d98fa9b3ac69a;
       public          taiga    false                       1259    7771307 3   project_references_786d19a68c0211ed921d98fa9b3ac69a    SEQUENCE     �   CREATE SEQUENCE public.project_references_786d19a68c0211ed921d98fa9b3ac69a
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 J   DROP SEQUENCE public.project_references_786d19a68c0211ed921d98fa9b3ac69a;
       public          taiga    false                       1259    7771309 3   project_references_7875c97a8c0211ed921d98fa9b3ac69a    SEQUENCE     �   CREATE SEQUENCE public.project_references_7875c97a8c0211ed921d98fa9b3ac69a
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 J   DROP SEQUENCE public.project_references_7875c97a8c0211ed921d98fa9b3ac69a;
       public          taiga    false                       1259    7771311 3   project_references_787bbc688c0211ed921d98fa9b3ac69a    SEQUENCE     �   CREATE SEQUENCE public.project_references_787bbc688c0211ed921d98fa9b3ac69a
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 J   DROP SEQUENCE public.project_references_787bbc688c0211ed921d98fa9b3ac69a;
       public          taiga    false                       1259    7771313 3   project_references_78809db48c0211ed921d98fa9b3ac69a    SEQUENCE     �   CREATE SEQUENCE public.project_references_78809db48c0211ed921d98fa9b3ac69a
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 J   DROP SEQUENCE public.project_references_78809db48c0211ed921d98fa9b3ac69a;
       public          taiga    false                       1259    7771315 3   project_references_7889b3688c0211ed921d98fa9b3ac69a    SEQUENCE     �   CREATE SEQUENCE public.project_references_7889b3688c0211ed921d98fa9b3ac69a
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 J   DROP SEQUENCE public.project_references_7889b3688c0211ed921d98fa9b3ac69a;
       public          taiga    false                       1259    7771319 3   project_references_7d13504c8c0211ed921d98fa9b3ac69a    SEQUENCE     �   CREATE SEQUENCE public.project_references_7d13504c8c0211ed921d98fa9b3ac69a
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 J   DROP SEQUENCE public.project_references_7d13504c8c0211ed921d98fa9b3ac69a;
       public          taiga    false            	           1259    7771321 3   project_references_7d1881ca8c0211ed921d98fa9b3ac69a    SEQUENCE     �   CREATE SEQUENCE public.project_references_7d1881ca8c0211ed921d98fa9b3ac69a
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 J   DROP SEQUENCE public.project_references_7d1881ca8c0211ed921d98fa9b3ac69a;
       public          taiga    false            
           1259    7771323 3   project_references_7d201bb08c0211ed921d98fa9b3ac69a    SEQUENCE     �   CREATE SEQUENCE public.project_references_7d201bb08c0211ed921d98fa9b3ac69a
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 J   DROP SEQUENCE public.project_references_7d201bb08c0211ed921d98fa9b3ac69a;
       public          taiga    false                       1259    7771325 3   project_references_7d7c57548c0211ed921d98fa9b3ac69a    SEQUENCE     �   CREATE SEQUENCE public.project_references_7d7c57548c0211ed921d98fa9b3ac69a
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 J   DROP SEQUENCE public.project_references_7d7c57548c0211ed921d98fa9b3ac69a;
       public          taiga    false                       1259    7771327 3   project_references_7d8149b28c0211ed921d98fa9b3ac69a    SEQUENCE     �   CREATE SEQUENCE public.project_references_7d8149b28c0211ed921d98fa9b3ac69a
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 J   DROP SEQUENCE public.project_references_7d8149b28c0211ed921d98fa9b3ac69a;
       public          taiga    false                       1259    7771329 3   project_references_7d86c0728c0211ed921d98fa9b3ac69a    SEQUENCE     �   CREATE SEQUENCE public.project_references_7d86c0728c0211ed921d98fa9b3ac69a
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 J   DROP SEQUENCE public.project_references_7d86c0728c0211ed921d98fa9b3ac69a;
       public          taiga    false                       1259    7771331 3   project_references_7d8b2cde8c0211ed921d98fa9b3ac69a    SEQUENCE     �   CREATE SEQUENCE public.project_references_7d8b2cde8c0211ed921d98fa9b3ac69a
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 J   DROP SEQUENCE public.project_references_7d8b2cde8c0211ed921d98fa9b3ac69a;
       public          taiga    false                       1259    7771333 3   project_references_7d8ff1e28c0211ed921d98fa9b3ac69a    SEQUENCE     �   CREATE SEQUENCE public.project_references_7d8ff1e28c0211ed921d98fa9b3ac69a
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 J   DROP SEQUENCE public.project_references_7d8ff1e28c0211ed921d98fa9b3ac69a;
       public          taiga    false                       1259    7771335 3   project_references_7d94ef628c0211ed921d98fa9b3ac69a    SEQUENCE     �   CREATE SEQUENCE public.project_references_7d94ef628c0211ed921d98fa9b3ac69a
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 J   DROP SEQUENCE public.project_references_7d94ef628c0211ed921d98fa9b3ac69a;
       public          taiga    false                       1259    7771337 3   project_references_7d9bc6348c0211ed921d98fa9b3ac69a    SEQUENCE     �   CREATE SEQUENCE public.project_references_7d9bc6348c0211ed921d98fa9b3ac69a
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 J   DROP SEQUENCE public.project_references_7d9bc6348c0211ed921d98fa9b3ac69a;
       public          taiga    false                       1259    7771339 3   project_references_7da2cba08c0211ed921d98fa9b3ac69a    SEQUENCE     �   CREATE SEQUENCE public.project_references_7da2cba08c0211ed921d98fa9b3ac69a
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 J   DROP SEQUENCE public.project_references_7da2cba08c0211ed921d98fa9b3ac69a;
       public          taiga    false                       1259    7771341 3   project_references_7da8a3d68c0211ed921d98fa9b3ac69a    SEQUENCE     �   CREATE SEQUENCE public.project_references_7da8a3d68c0211ed921d98fa9b3ac69a
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 J   DROP SEQUENCE public.project_references_7da8a3d68c0211ed921d98fa9b3ac69a;
       public          taiga    false                       1259    7771343 3   project_references_7dad51248c0211ed921d98fa9b3ac69a    SEQUENCE     �   CREATE SEQUENCE public.project_references_7dad51248c0211ed921d98fa9b3ac69a
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 J   DROP SEQUENCE public.project_references_7dad51248c0211ed921d98fa9b3ac69a;
       public          taiga    false                       1259    7771345 3   project_references_7db5afc28c0211ed921d98fa9b3ac69a    SEQUENCE     �   CREATE SEQUENCE public.project_references_7db5afc28c0211ed921d98fa9b3ac69a
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 J   DROP SEQUENCE public.project_references_7db5afc28c0211ed921d98fa9b3ac69a;
       public          taiga    false                       1259    7771347 3   project_references_7dbb6b428c0211ed921d98fa9b3ac69a    SEQUENCE     �   CREATE SEQUENCE public.project_references_7dbb6b428c0211ed921d98fa9b3ac69a
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 J   DROP SEQUENCE public.project_references_7dbb6b428c0211ed921d98fa9b3ac69a;
       public          taiga    false                       1259    7771349 3   project_references_7dc6a76e8c0211ed921d98fa9b3ac69a    SEQUENCE     �   CREATE SEQUENCE public.project_references_7dc6a76e8c0211ed921d98fa9b3ac69a
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 J   DROP SEQUENCE public.project_references_7dc6a76e8c0211ed921d98fa9b3ac69a;
       public          taiga    false                       1259    7771351 3   project_references_7dcc99448c0211ed921d98fa9b3ac69a    SEQUENCE     �   CREATE SEQUENCE public.project_references_7dcc99448c0211ed921d98fa9b3ac69a
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 J   DROP SEQUENCE public.project_references_7dcc99448c0211ed921d98fa9b3ac69a;
       public          taiga    false                       1259    7771353 3   project_references_7dd216da8c0211ed921d98fa9b3ac69a    SEQUENCE     �   CREATE SEQUENCE public.project_references_7dd216da8c0211ed921d98fa9b3ac69a
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 J   DROP SEQUENCE public.project_references_7dd216da8c0211ed921d98fa9b3ac69a;
       public          taiga    false                       1259    7771355 3   project_references_7dd724f48c0211ed921d98fa9b3ac69a    SEQUENCE     �   CREATE SEQUENCE public.project_references_7dd724f48c0211ed921d98fa9b3ac69a
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 J   DROP SEQUENCE public.project_references_7dd724f48c0211ed921d98fa9b3ac69a;
       public          taiga    false                       1259    7771357 3   project_references_7ddfa7d28c0211ed921d98fa9b3ac69a    SEQUENCE     �   CREATE SEQUENCE public.project_references_7ddfa7d28c0211ed921d98fa9b3ac69a
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 J   DROP SEQUENCE public.project_references_7ddfa7d28c0211ed921d98fa9b3ac69a;
       public          taiga    false                       1259    7771359 3   project_references_7de67ed68c0211ed921d98fa9b3ac69a    SEQUENCE     �   CREATE SEQUENCE public.project_references_7de67ed68c0211ed921d98fa9b3ac69a
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 J   DROP SEQUENCE public.project_references_7de67ed68c0211ed921d98fa9b3ac69a;
       public          taiga    false                       1259    7771361 3   project_references_7ded18868c0211ed921d98fa9b3ac69a    SEQUENCE     �   CREATE SEQUENCE public.project_references_7ded18868c0211ed921d98fa9b3ac69a
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 J   DROP SEQUENCE public.project_references_7ded18868c0211ed921d98fa9b3ac69a;
       public          taiga    false                       1259    7771363 3   project_references_7df75d008c0211ed921d98fa9b3ac69a    SEQUENCE     �   CREATE SEQUENCE public.project_references_7df75d008c0211ed921d98fa9b3ac69a
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 J   DROP SEQUENCE public.project_references_7df75d008c0211ed921d98fa9b3ac69a;
       public          taiga    false                       1259    7771365 3   project_references_7e01e82e8c0211ed921d98fa9b3ac69a    SEQUENCE     �   CREATE SEQUENCE public.project_references_7e01e82e8c0211ed921d98fa9b3ac69a
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 J   DROP SEQUENCE public.project_references_7e01e82e8c0211ed921d98fa9b3ac69a;
       public          taiga    false                        1259    7771367 3   project_references_7e3e935a8c0211ed921d98fa9b3ac69a    SEQUENCE     �   CREATE SEQUENCE public.project_references_7e3e935a8c0211ed921d98fa9b3ac69a
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 J   DROP SEQUENCE public.project_references_7e3e935a8c0211ed921d98fa9b3ac69a;
       public          taiga    false            !           1259    7771369 3   project_references_7e43889c8c0211ed921d98fa9b3ac69a    SEQUENCE     �   CREATE SEQUENCE public.project_references_7e43889c8c0211ed921d98fa9b3ac69a
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 J   DROP SEQUENCE public.project_references_7e43889c8c0211ed921d98fa9b3ac69a;
       public          taiga    false            "           1259    7771371 3   project_references_7e48a5708c0211ed921d98fa9b3ac69a    SEQUENCE     �   CREATE SEQUENCE public.project_references_7e48a5708c0211ed921d98fa9b3ac69a
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 J   DROP SEQUENCE public.project_references_7e48a5708c0211ed921d98fa9b3ac69a;
       public          taiga    false            #           1259    7771373 3   project_references_7e4e6ca88c0211ed921d98fa9b3ac69a    SEQUENCE     �   CREATE SEQUENCE public.project_references_7e4e6ca88c0211ed921d98fa9b3ac69a
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 J   DROP SEQUENCE public.project_references_7e4e6ca88c0211ed921d98fa9b3ac69a;
       public          taiga    false            $           1259    7771375 3   project_references_7e53e2a08c0211ed921d98fa9b3ac69a    SEQUENCE     �   CREATE SEQUENCE public.project_references_7e53e2a08c0211ed921d98fa9b3ac69a
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 J   DROP SEQUENCE public.project_references_7e53e2a08c0211ed921d98fa9b3ac69a;
       public          taiga    false            %           1259    7771377 3   project_references_7e5b09ae8c0211ed921d98fa9b3ac69a    SEQUENCE     �   CREATE SEQUENCE public.project_references_7e5b09ae8c0211ed921d98fa9b3ac69a
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 J   DROP SEQUENCE public.project_references_7e5b09ae8c0211ed921d98fa9b3ac69a;
       public          taiga    false            &           1259    7771379 3   project_references_7e61297e8c0211ed921d98fa9b3ac69a    SEQUENCE     �   CREATE SEQUENCE public.project_references_7e61297e8c0211ed921d98fa9b3ac69a
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 J   DROP SEQUENCE public.project_references_7e61297e8c0211ed921d98fa9b3ac69a;
       public          taiga    false            '           1259    7771381 3   project_references_7e660d368c0211ed921d98fa9b3ac69a    SEQUENCE     �   CREATE SEQUENCE public.project_references_7e660d368c0211ed921d98fa9b3ac69a
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 J   DROP SEQUENCE public.project_references_7e660d368c0211ed921d98fa9b3ac69a;
       public          taiga    false            (           1259    7771383 3   project_references_7e6ae9468c0211ed921d98fa9b3ac69a    SEQUENCE     �   CREATE SEQUENCE public.project_references_7e6ae9468c0211ed921d98fa9b3ac69a
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 J   DROP SEQUENCE public.project_references_7e6ae9468c0211ed921d98fa9b3ac69a;
       public          taiga    false            )           1259    7771385 3   project_references_7e702a148c0211ed921d98fa9b3ac69a    SEQUENCE     �   CREATE SEQUENCE public.project_references_7e702a148c0211ed921d98fa9b3ac69a
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 J   DROP SEQUENCE public.project_references_7e702a148c0211ed921d98fa9b3ac69a;
       public          taiga    false            *           1259    7771387 3   project_references_7ef03bb48c0211ed921d98fa9b3ac69a    SEQUENCE     �   CREATE SEQUENCE public.project_references_7ef03bb48c0211ed921d98fa9b3ac69a
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 J   DROP SEQUENCE public.project_references_7ef03bb48c0211ed921d98fa9b3ac69a;
       public          taiga    false            +           1259    7771389 3   project_references_7f49490c8c0211ed921d98fa9b3ac69a    SEQUENCE     �   CREATE SEQUENCE public.project_references_7f49490c8c0211ed921d98fa9b3ac69a
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 J   DROP SEQUENCE public.project_references_7f49490c8c0211ed921d98fa9b3ac69a;
       public          taiga    false            ,           1259    7771391 3   project_references_7f4e90ec8c0211ed921d98fa9b3ac69a    SEQUENCE     �   CREATE SEQUENCE public.project_references_7f4e90ec8c0211ed921d98fa9b3ac69a
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 J   DROP SEQUENCE public.project_references_7f4e90ec8c0211ed921d98fa9b3ac69a;
       public          taiga    false            -           1259    7771393 3   project_references_8a10b85c8c0211ed921d98fa9b3ac69a    SEQUENCE     �   CREATE SEQUENCE public.project_references_8a10b85c8c0211ed921d98fa9b3ac69a
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 J   DROP SEQUENCE public.project_references_8a10b85c8c0211ed921d98fa9b3ac69a;
       public          taiga    false            /           1259    7797871 3   project_references_8c6fc7388c0611edba2d98fa9b3ac69a    SEQUENCE     �   CREATE SEQUENCE public.project_references_8c6fc7388c0611edba2d98fa9b3ac69a
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 J   DROP SEQUENCE public.project_references_8c6fc7388c0611edba2d98fa9b3ac69a;
       public          taiga    false            0           1259    7797873 3   project_references_8e337a4c8c0611edba2d98fa9b3ac69a    SEQUENCE     �   CREATE SEQUENCE public.project_references_8e337a4c8c0611edba2d98fa9b3ac69a
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 J   DROP SEQUENCE public.project_references_8e337a4c8c0611edba2d98fa9b3ac69a;
       public          taiga    false            1           1259    7797875 3   project_references_8ee1e3de8c0611edba2d98fa9b3ac69a    SEQUENCE     �   CREATE SEQUENCE public.project_references_8ee1e3de8c0611edba2d98fa9b3ac69a
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 J   DROP SEQUENCE public.project_references_8ee1e3de8c0611edba2d98fa9b3ac69a;
       public          taiga    false            2           1259    7797877 3   project_references_9009f17a8c0611edba2d98fa9b3ac69a    SEQUENCE     �   CREATE SEQUENCE public.project_references_9009f17a8c0611edba2d98fa9b3ac69a
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 J   DROP SEQUENCE public.project_references_9009f17a8c0611edba2d98fa9b3ac69a;
       public          taiga    false            A           1259    7797915 3   project_references_910e640a8c0811ed8d7d98fa9b3ac69a    SEQUENCE     �   CREATE SEQUENCE public.project_references_910e640a8c0811ed8d7d98fa9b3ac69a
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 J   DROP SEQUENCE public.project_references_910e640a8c0811ed8d7d98fa9b3ac69a;
       public          taiga    false            3           1259    7797879 3   project_references_91e79b148c0611edba2d98fa9b3ac69a    SEQUENCE     �   CREATE SEQUENCE public.project_references_91e79b148c0611edba2d98fa9b3ac69a
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 J   DROP SEQUENCE public.project_references_91e79b148c0611edba2d98fa9b3ac69a;
       public          taiga    false            4           1259    7797881 3   project_references_92b342be8c0611edba2d98fa9b3ac69a    SEQUENCE     �   CREATE SEQUENCE public.project_references_92b342be8c0611edba2d98fa9b3ac69a
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 J   DROP SEQUENCE public.project_references_92b342be8c0611edba2d98fa9b3ac69a;
       public          taiga    false            B           1259    7797917 3   project_references_933915ea8c0811ed8d7d98fa9b3ac69a    SEQUENCE     �   CREATE SEQUENCE public.project_references_933915ea8c0811ed8d7d98fa9b3ac69a
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 J   DROP SEQUENCE public.project_references_933915ea8c0811ed8d7d98fa9b3ac69a;
       public          taiga    false            C           1259    7797919 3   project_references_93e0c4168c0811ed8d7d98fa9b3ac69a    SEQUENCE     �   CREATE SEQUENCE public.project_references_93e0c4168c0811ed8d7d98fa9b3ac69a
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 J   DROP SEQUENCE public.project_references_93e0c4168c0811ed8d7d98fa9b3ac69a;
       public          taiga    false            D           1259    7797921 3   project_references_94fb50a08c0811ed8d7d98fa9b3ac69a    SEQUENCE     �   CREATE SEQUENCE public.project_references_94fb50a08c0811ed8d7d98fa9b3ac69a
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 J   DROP SEQUENCE public.project_references_94fb50a08c0811ed8d7d98fa9b3ac69a;
       public          taiga    false            E           1259    7797923 3   project_references_96c415ac8c0811ed8d7d98fa9b3ac69a    SEQUENCE     �   CREATE SEQUENCE public.project_references_96c415ac8c0811ed8d7d98fa9b3ac69a
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 J   DROP SEQUENCE public.project_references_96c415ac8c0811ed8d7d98fa9b3ac69a;
       public          taiga    false            F           1259    7797925 3   project_references_97a4c5168c0811ed8d7d98fa9b3ac69a    SEQUENCE     �   CREATE SEQUENCE public.project_references_97a4c5168c0811ed8d7d98fa9b3ac69a
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 J   DROP SEQUENCE public.project_references_97a4c5168c0811ed8d7d98fa9b3ac69a;
       public          taiga    false            .           1259    7771399 3   project_references_a2efe6c28c0211ed8a2998fa9b3ac69a    SEQUENCE     �   CREATE SEQUENCE public.project_references_a2efe6c28c0211ed8a2998fa9b3ac69a
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 J   DROP SEQUENCE public.project_references_a2efe6c28c0211ed8a2998fa9b3ac69a;
       public          taiga    false            5           1259    7797886 3   project_references_a3d67c468c0611edba2d98fa9b3ac69a    SEQUENCE     �   CREATE SEQUENCE public.project_references_a3d67c468c0611edba2d98fa9b3ac69a
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 J   DROP SEQUENCE public.project_references_a3d67c468c0611edba2d98fa9b3ac69a;
       public          taiga    false            6           1259    7797888 3   project_references_a5a0cde28c0611edba2d98fa9b3ac69a    SEQUENCE     �   CREATE SEQUENCE public.project_references_a5a0cde28c0611edba2d98fa9b3ac69a
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 J   DROP SEQUENCE public.project_references_a5a0cde28c0611edba2d98fa9b3ac69a;
       public          taiga    false            7           1259    7797890 3   project_references_a64a1a8c8c0611edba2d98fa9b3ac69a    SEQUENCE     �   CREATE SEQUENCE public.project_references_a64a1a8c8c0611edba2d98fa9b3ac69a
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 J   DROP SEQUENCE public.project_references_a64a1a8c8c0611edba2d98fa9b3ac69a;
       public          taiga    false            8           1259    7797892 3   project_references_a761ca468c0611edba2d98fa9b3ac69a    SEQUENCE     �   CREATE SEQUENCE public.project_references_a761ca468c0611edba2d98fa9b3ac69a
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 J   DROP SEQUENCE public.project_references_a761ca468c0611edba2d98fa9b3ac69a;
       public          taiga    false            9           1259    7797894 3   project_references_a906d13e8c0611edba2d98fa9b3ac69a    SEQUENCE     �   CREATE SEQUENCE public.project_references_a906d13e8c0611edba2d98fa9b3ac69a
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 J   DROP SEQUENCE public.project_references_a906d13e8c0611edba2d98fa9b3ac69a;
       public          taiga    false            :           1259    7797896 3   project_references_a9d5efbe8c0611edba2d98fa9b3ac69a    SEQUENCE     �   CREATE SEQUENCE public.project_references_a9d5efbe8c0611edba2d98fa9b3ac69a
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 J   DROP SEQUENCE public.project_references_a9d5efbe8c0611edba2d98fa9b3ac69a;
       public          taiga    false            ;           1259    7797898 3   project_references_b54b88548c0611edba2d98fa9b3ac69a    SEQUENCE     �   CREATE SEQUENCE public.project_references_b54b88548c0611edba2d98fa9b3ac69a
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 J   DROP SEQUENCE public.project_references_b54b88548c0611edba2d98fa9b3ac69a;
       public          taiga    false            <           1259    7797900 3   project_references_b70544968c0611edba2d98fa9b3ac69a    SEQUENCE     �   CREATE SEQUENCE public.project_references_b70544968c0611edba2d98fa9b3ac69a
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 J   DROP SEQUENCE public.project_references_b70544968c0611edba2d98fa9b3ac69a;
       public          taiga    false            =           1259    7797902 3   project_references_b7af78628c0611edba2d98fa9b3ac69a    SEQUENCE     �   CREATE SEQUENCE public.project_references_b7af78628c0611edba2d98fa9b3ac69a
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 J   DROP SEQUENCE public.project_references_b7af78628c0611edba2d98fa9b3ac69a;
       public          taiga    false            >           1259    7797904 3   project_references_b8d0dad88c0611edba2d98fa9b3ac69a    SEQUENCE     �   CREATE SEQUENCE public.project_references_b8d0dad88c0611edba2d98fa9b3ac69a
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 J   DROP SEQUENCE public.project_references_b8d0dad88c0611edba2d98fa9b3ac69a;
       public          taiga    false            ?           1259    7797906 3   project_references_ba7814a08c0611edba2d98fa9b3ac69a    SEQUENCE     �   CREATE SEQUENCE public.project_references_ba7814a08c0611edba2d98fa9b3ac69a
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 J   DROP SEQUENCE public.project_references_ba7814a08c0611edba2d98fa9b3ac69a;
       public          taiga    false            @           1259    7797908 3   project_references_bb485eee8c0611edba2d98fa9b3ac69a    SEQUENCE     �   CREATE SEQUENCE public.project_references_bb485eee8c0611edba2d98fa9b3ac69a
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 J   DROP SEQUENCE public.project_references_bb485eee8c0611edba2d98fa9b3ac69a;
       public          taiga    false            �            1259    7770950 &   projects_invitations_projectinvitation    TABLE     �  CREATE TABLE public.projects_invitations_projectinvitation (
    id uuid NOT NULL,
    email character varying(255) NOT NULL,
    status character varying(50) NOT NULL,
    created_at timestamp with time zone NOT NULL,
    num_emails_sent integer NOT NULL,
    resent_at timestamp with time zone,
    revoked_at timestamp with time zone,
    invited_by_id uuid,
    project_id uuid NOT NULL,
    resent_by_id uuid,
    revoked_by_id uuid,
    role_id uuid NOT NULL,
    user_id uuid
);
 :   DROP TABLE public.projects_invitations_projectinvitation;
       public         heap    taiga    false            �            1259    7770911 &   projects_memberships_projectmembership    TABLE     �   CREATE TABLE public.projects_memberships_projectmembership (
    id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    project_id uuid NOT NULL,
    role_id uuid NOT NULL,
    user_id uuid NOT NULL
);
 :   DROP TABLE public.projects_memberships_projectmembership;
       public         heap    taiga    false            �            1259    7770870    projects_project    TABLE     �  CREATE TABLE public.projects_project (
    id uuid NOT NULL,
    name character varying(80) NOT NULL,
    description character varying(220),
    color integer NOT NULL,
    logo character varying(500),
    created_at timestamp with time zone NOT NULL,
    modified_at timestamp with time zone NOT NULL,
    public_permissions text[],
    workspace_member_permissions text[],
    owner_id uuid NOT NULL,
    workspace_id uuid NOT NULL
);
 $   DROP TABLE public.projects_project;
       public         heap    taiga    false            �            1259    7770878    projects_projecttemplate    TABLE     ]  CREATE TABLE public.projects_projecttemplate (
    id uuid NOT NULL,
    name character varying(250) NOT NULL,
    slug character varying(250) NOT NULL,
    created_at timestamp with time zone NOT NULL,
    modified_at timestamp with time zone NOT NULL,
    default_owner_role character varying(50) NOT NULL,
    roles jsonb,
    workflows jsonb
);
 ,   DROP TABLE public.projects_projecttemplate;
       public         heap    taiga    false            �            1259    7770890    projects_roles_projectrole    TABLE       CREATE TABLE public.projects_roles_projectrole (
    id uuid NOT NULL,
    name character varying(200) NOT NULL,
    slug character varying(250) NOT NULL,
    permissions text[],
    "order" bigint NOT NULL,
    is_admin boolean NOT NULL,
    project_id uuid NOT NULL
);
 .   DROP TABLE public.projects_roles_projectrole;
       public         heap    taiga    false            �            1259    7771050    stories_assignees    TABLE     �   CREATE TABLE public.stories_assignees (
    id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    story_id uuid NOT NULL,
    user_id uuid NOT NULL
);
 %   DROP TABLE public.stories_assignees;
       public         heap    taiga    false            �            1259    7771040    stories_story    TABLE     �  CREATE TABLE public.stories_story (
    id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    version bigint NOT NULL,
    ref bigint NOT NULL,
    title character varying(500) NOT NULL,
    "order" numeric(16,10) NOT NULL,
    created_by_id uuid NOT NULL,
    project_id uuid NOT NULL,
    status_id uuid NOT NULL,
    workflow_id uuid NOT NULL,
    CONSTRAINT stories_story_version_check CHECK ((version >= 0))
);
 !   DROP TABLE public.stories_story;
       public         heap    taiga    false            �            1259    7771107    tokens_denylistedtoken    TABLE     �   CREATE TABLE public.tokens_denylistedtoken (
    id uuid NOT NULL,
    denylisted_at timestamp with time zone NOT NULL,
    token_id uuid NOT NULL
);
 *   DROP TABLE public.tokens_denylistedtoken;
       public         heap    taiga    false            �            1259    7771097    tokens_outstandingtoken    TABLE     2  CREATE TABLE public.tokens_outstandingtoken (
    id uuid NOT NULL,
    object_id uuid,
    jti character varying(255) NOT NULL,
    token_type text NOT NULL,
    token text NOT NULL,
    created_at timestamp with time zone,
    expires_at timestamp with time zone NOT NULL,
    content_type_id integer
);
 +   DROP TABLE public.tokens_outstandingtoken;
       public         heap    taiga    false            �            1259    7770705    users_authdata    TABLE     �   CREATE TABLE public.users_authdata (
    id uuid NOT NULL,
    key character varying(50) NOT NULL,
    value character varying(300) NOT NULL,
    extra jsonb,
    user_id uuid NOT NULL
);
 "   DROP TABLE public.users_authdata;
       public         heap    taiga    false            �            1259    7770693 
   users_user    TABLE       CREATE TABLE public.users_user (
    password character varying(128) NOT NULL,
    last_login timestamp with time zone,
    id uuid NOT NULL,
    username character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    color integer NOT NULL,
    is_active boolean NOT NULL,
    is_superuser boolean NOT NULL,
    full_name character varying(256),
    accepted_terms boolean NOT NULL,
    lang character varying(20) NOT NULL,
    date_joined timestamp with time zone NOT NULL,
    date_verification timestamp with time zone
);
    DROP TABLE public.users_user;
       public         heap    taiga    false            �            1259    7771006    workflows_workflow    TABLE     �   CREATE TABLE public.workflows_workflow (
    id uuid NOT NULL,
    name character varying(250) NOT NULL,
    slug character varying(250) NOT NULL,
    "order" bigint NOT NULL,
    project_id uuid NOT NULL
);
 &   DROP TABLE public.workflows_workflow;
       public         heap    taiga    false            �            1259    7771014    workflows_workflowstatus    TABLE     �   CREATE TABLE public.workflows_workflowstatus (
    id uuid NOT NULL,
    name character varying(250) NOT NULL,
    slug character varying(250) NOT NULL,
    color integer NOT NULL,
    "order" bigint NOT NULL,
    workflow_id uuid NOT NULL
);
 ,   DROP TABLE public.workflows_workflowstatus;
       public         heap    taiga    false            �            1259    7771151 *   workspaces_memberships_workspacemembership    TABLE     �   CREATE TABLE public.workspaces_memberships_workspacemembership (
    id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    role_id uuid NOT NULL,
    user_id uuid NOT NULL,
    workspace_id uuid NOT NULL
);
 >   DROP TABLE public.workspaces_memberships_workspacemembership;
       public         heap    taiga    false            �            1259    7771130    workspaces_roles_workspacerole    TABLE       CREATE TABLE public.workspaces_roles_workspacerole (
    id uuid NOT NULL,
    name character varying(200) NOT NULL,
    slug character varying(250) NOT NULL,
    permissions text[],
    "order" bigint NOT NULL,
    is_admin boolean NOT NULL,
    workspace_id uuid NOT NULL
);
 2   DROP TABLE public.workspaces_roles_workspacerole;
       public         heap    taiga    false            �            1259    7770865    workspaces_workspace    TABLE     *  CREATE TABLE public.workspaces_workspace (
    id uuid NOT NULL,
    name character varying(40) NOT NULL,
    color integer NOT NULL,
    created_at timestamp with time zone NOT NULL,
    modified_at timestamp with time zone NOT NULL,
    is_premium boolean NOT NULL,
    owner_id uuid NOT NULL
);
 (   DROP TABLE public.workspaces_workspace;
       public         heap    taiga    false            8           2604    7771244    procrastinate_events id    DEFAULT     �   ALTER TABLE ONLY public.procrastinate_events ALTER COLUMN id SET DEFAULT nextval('public.procrastinate_events_id_seq'::regclass);
 F   ALTER TABLE public.procrastinate_events ALTER COLUMN id DROP DEFAULT;
       public          taiga    false    242    243    243            2           2604    7771214    procrastinate_jobs id    DEFAULT     ~   ALTER TABLE ONLY public.procrastinate_jobs ALTER COLUMN id SET DEFAULT nextval('public.procrastinate_jobs_id_seq'::regclass);
 D   ALTER TABLE public.procrastinate_jobs ALTER COLUMN id DROP DEFAULT;
       public          taiga    false    239    238    239            6           2604    7771228     procrastinate_periodic_defers id    DEFAULT     �   ALTER TABLE ONLY public.procrastinate_periodic_defers ALTER COLUMN id SET DEFAULT nextval('public.procrastinate_periodic_defers_id_seq'::regclass);
 O   ALTER TABLE public.procrastinate_periodic_defers ALTER COLUMN id DROP DEFAULT;
       public          taiga    false    241    240    241            �          0    7770769 
   auth_group 
   TABLE DATA           .   COPY public.auth_group (id, name) FROM stdin;
    public          taiga    false    214   _�      �          0    7770778    auth_group_permissions 
   TABLE DATA           M   COPY public.auth_group_permissions (id, group_id, permission_id) FROM stdin;
    public          taiga    false    216   |�      �          0    7770762    auth_permission 
   TABLE DATA           N   COPY public.auth_permission (id, name, content_type_id, codename) FROM stdin;
    public          taiga    false    212   ��      �          0    7770739    django_admin_log 
   TABLE DATA           �   COPY public.django_admin_log (id, action_time, object_id, object_repr, action_flag, change_message, content_type_id, user_id) FROM stdin;
    public          taiga    false    210   j�      �          0    7770730    django_content_type 
   TABLE DATA           C   COPY public.django_content_type (id, app_label, model) FROM stdin;
    public          taiga    false    208   ��      �          0    7770685    django_migrations 
   TABLE DATA           C   COPY public.django_migrations (id, app, name, applied) FROM stdin;
    public          taiga    false    204   ��      �          0    7770996    django_session 
   TABLE DATA           P   COPY public.django_session (session_key, session_data, expire_date) FROM stdin;
    public          taiga    false    229   g�      �          0    7770819    easy_thumbnails_source 
   TABLE DATA           R   COPY public.easy_thumbnails_source (id, storage_hash, name, modified) FROM stdin;
    public          taiga    false    218   ��      �          0    7770826    easy_thumbnails_thumbnail 
   TABLE DATA           `   COPY public.easy_thumbnails_thumbnail (id, storage_hash, name, modified, source_id) FROM stdin;
    public          taiga    false    220   �      �          0    7770851 #   easy_thumbnails_thumbnaildimensions 
   TABLE DATA           ^   COPY public.easy_thumbnails_thumbnaildimensions (id, thumbnail_id, width, height) FROM stdin;
    public          taiga    false    222   #�      �          0    7771241    procrastinate_events 
   TABLE DATA           D   COPY public.procrastinate_events (id, job_id, type, at) FROM stdin;
    public          taiga    false    243   @�      �          0    7771211    procrastinate_jobs 
   TABLE DATA           �   COPY public.procrastinate_jobs (id, queue_name, task_name, lock, queueing_lock, args, status, scheduled_at, attempts) FROM stdin;
    public          taiga    false    239   �      �          0    7771225    procrastinate_periodic_defers 
   TABLE DATA           x   COPY public.procrastinate_periodic_defers (id, task_name, defer_timestamp, job_id, queue_name, periodic_id) FROM stdin;
    public          taiga    false    241   ��      �          0    7770950 &   projects_invitations_projectinvitation 
   TABLE DATA           �   COPY public.projects_invitations_projectinvitation (id, email, status, created_at, num_emails_sent, resent_at, revoked_at, invited_by_id, project_id, resent_by_id, revoked_by_id, role_id, user_id) FROM stdin;
    public          taiga    false    228   ��      �          0    7770911 &   projects_memberships_projectmembership 
   TABLE DATA           n   COPY public.projects_memberships_projectmembership (id, created_at, project_id, role_id, user_id) FROM stdin;
    public          taiga    false    227   1�      �          0    7770870    projects_project 
   TABLE DATA           �   COPY public.projects_project (id, name, description, color, logo, created_at, modified_at, public_permissions, workspace_member_permissions, owner_id, workspace_id) FROM stdin;
    public          taiga    false    224   �      �          0    7770878    projects_projecttemplate 
   TABLE DATA           �   COPY public.projects_projecttemplate (id, name, slug, created_at, modified_at, default_owner_role, roles, workflows) FROM stdin;
    public          taiga    false    225   y'      �          0    7770890    projects_roles_projectrole 
   TABLE DATA           p   COPY public.projects_roles_projectrole (id, name, slug, permissions, "order", is_admin, project_id) FROM stdin;
    public          taiga    false    226   �(      �          0    7771050    stories_assignees 
   TABLE DATA           N   COPY public.stories_assignees (id, created_at, story_id, user_id) FROM stdin;
    public          taiga    false    233   P0      �          0    7771040    stories_story 
   TABLE DATA           �   COPY public.stories_story (id, created_at, version, ref, title, "order", created_by_id, project_id, status_id, workflow_id) FROM stdin;
    public          taiga    false    232   ��      �          0    7771107    tokens_denylistedtoken 
   TABLE DATA           M   COPY public.tokens_denylistedtoken (id, denylisted_at, token_id) FROM stdin;
    public          taiga    false    235   �Z      �          0    7771097    tokens_outstandingtoken 
   TABLE DATA           �   COPY public.tokens_outstandingtoken (id, object_id, jti, token_type, token, created_at, expires_at, content_type_id) FROM stdin;
    public          taiga    false    234   �[      �          0    7770705    users_authdata 
   TABLE DATA           H   COPY public.users_authdata (id, key, value, extra, user_id) FROM stdin;
    public          taiga    false    206   �      �          0    7770693 
   users_user 
   TABLE DATA           �   COPY public.users_user (password, last_login, id, username, email, color, is_active, is_superuser, full_name, accepted_terms, lang, date_joined, date_verification) FROM stdin;
    public          taiga    false    205   ,�      �          0    7771006    workflows_workflow 
   TABLE DATA           Q   COPY public.workflows_workflow (id, name, slug, "order", project_id) FROM stdin;
    public          taiga    false    230   �      �          0    7771014    workflows_workflowstatus 
   TABLE DATA           _   COPY public.workflows_workflowstatus (id, name, slug, color, "order", workflow_id) FROM stdin;
    public          taiga    false    231   �      �          0    7771151 *   workspaces_memberships_workspacemembership 
   TABLE DATA           t   COPY public.workspaces_memberships_workspacemembership (id, created_at, role_id, user_id, workspace_id) FROM stdin;
    public          taiga    false    237   �      �          0    7771130    workspaces_roles_workspacerole 
   TABLE DATA           v   COPY public.workspaces_roles_workspacerole (id, name, slug, permissions, "order", is_admin, workspace_id) FROM stdin;
    public          taiga    false    236   �      �          0    7770865    workspaces_workspace 
   TABLE DATA           n   COPY public.workspaces_workspace (id, name, color, created_at, modified_at, is_premium, owner_id) FROM stdin;
    public          taiga    false    223   ��      %           0    0    auth_group_id_seq    SEQUENCE SET     @   SELECT pg_catalog.setval('public.auth_group_id_seq', 1, false);
          public          taiga    false    213            &           0    0    auth_group_permissions_id_seq    SEQUENCE SET     L   SELECT pg_catalog.setval('public.auth_group_permissions_id_seq', 1, false);
          public          taiga    false    215            '           0    0    auth_permission_id_seq    SEQUENCE SET     E   SELECT pg_catalog.setval('public.auth_permission_id_seq', 96, true);
          public          taiga    false    211            (           0    0    django_admin_log_id_seq    SEQUENCE SET     F   SELECT pg_catalog.setval('public.django_admin_log_id_seq', 1, false);
          public          taiga    false    209            )           0    0    django_content_type_id_seq    SEQUENCE SET     I   SELECT pg_catalog.setval('public.django_content_type_id_seq', 24, true);
          public          taiga    false    207            *           0    0    django_migrations_id_seq    SEQUENCE SET     G   SELECT pg_catalog.setval('public.django_migrations_id_seq', 37, true);
          public          taiga    false    203            +           0    0    easy_thumbnails_source_id_seq    SEQUENCE SET     L   SELECT pg_catalog.setval('public.easy_thumbnails_source_id_seq', 27, true);
          public          taiga    false    217            ,           0    0     easy_thumbnails_thumbnail_id_seq    SEQUENCE SET     O   SELECT pg_catalog.setval('public.easy_thumbnails_thumbnail_id_seq', 54, true);
          public          taiga    false    219            -           0    0 *   easy_thumbnails_thumbnaildimensions_id_seq    SEQUENCE SET     Y   SELECT pg_catalog.setval('public.easy_thumbnails_thumbnaildimensions_id_seq', 1, false);
          public          taiga    false    221            .           0    0    procrastinate_events_id_seq    SEQUENCE SET     K   SELECT pg_catalog.setval('public.procrastinate_events_id_seq', 177, true);
          public          taiga    false    242            /           0    0    procrastinate_jobs_id_seq    SEQUENCE SET     H   SELECT pg_catalog.setval('public.procrastinate_jobs_id_seq', 59, true);
          public          taiga    false    238            0           0    0 $   procrastinate_periodic_defers_id_seq    SEQUENCE SET     S   SELECT pg_catalog.setval('public.procrastinate_periodic_defers_id_seq', 1, false);
          public          taiga    false    240            1           0    0 3   project_references_77e98d528c0211ed921d98fa9b3ac69a    SEQUENCE SET     b   SELECT pg_catalog.setval('public.project_references_77e98d528c0211ed921d98fa9b3ac69a', 20, true);
          public          taiga    false    244            2           0    0 3   project_references_77f3ab7a8c0211ed921d98fa9b3ac69a    SEQUENCE SET     b   SELECT pg_catalog.setval('public.project_references_77f3ab7a8c0211ed921d98fa9b3ac69a', 14, true);
          public          taiga    false    245            3           0    0 3   project_references_77fe003e8c0211ed921d98fa9b3ac69a    SEQUENCE SET     b   SELECT pg_catalog.setval('public.project_references_77fe003e8c0211ed921d98fa9b3ac69a', 12, true);
          public          taiga    false    246            4           0    0 3   project_references_7804bbd68c0211ed921d98fa9b3ac69a    SEQUENCE SET     b   SELECT pg_catalog.setval('public.project_references_7804bbd68c0211ed921d98fa9b3ac69a', 13, true);
          public          taiga    false    247            5           0    0 3   project_references_780b5ba88c0211ed921d98fa9b3ac69a    SEQUENCE SET     b   SELECT pg_catalog.setval('public.project_references_780b5ba88c0211ed921d98fa9b3ac69a', 17, true);
          public          taiga    false    248            6           0    0 3   project_references_78145e2e8c0211ed921d98fa9b3ac69a    SEQUENCE SET     b   SELECT pg_catalog.setval('public.project_references_78145e2e8c0211ed921d98fa9b3ac69a', 25, true);
          public          taiga    false    249            7           0    0 3   project_references_781de1b08c0211ed921d98fa9b3ac69a    SEQUENCE SET     b   SELECT pg_catalog.setval('public.project_references_781de1b08c0211ed921d98fa9b3ac69a', 25, true);
          public          taiga    false    250            8           0    0 3   project_references_782762da8c0211ed921d98fa9b3ac69a    SEQUENCE SET     a   SELECT pg_catalog.setval('public.project_references_782762da8c0211ed921d98fa9b3ac69a', 4, true);
          public          taiga    false    251            9           0    0 3   project_references_782e250c8c0211ed921d98fa9b3ac69a    SEQUENCE SET     b   SELECT pg_catalog.setval('public.project_references_782e250c8c0211ed921d98fa9b3ac69a', 15, true);
          public          taiga    false    252            :           0    0 3   project_references_783930dc8c0211ed921d98fa9b3ac69a    SEQUENCE SET     b   SELECT pg_catalog.setval('public.project_references_783930dc8c0211ed921d98fa9b3ac69a', 19, true);
          public          taiga    false    253            ;           0    0 3   project_references_784135528c0211ed921d98fa9b3ac69a    SEQUENCE SET     b   SELECT pg_catalog.setval('public.project_references_784135528c0211ed921d98fa9b3ac69a', 20, true);
          public          taiga    false    254            <           0    0 3   project_references_784cacc08c0211ed921d98fa9b3ac69a    SEQUENCE SET     b   SELECT pg_catalog.setval('public.project_references_784cacc08c0211ed921d98fa9b3ac69a', 13, true);
          public          taiga    false    255            =           0    0 3   project_references_78550f3c8c0211ed921d98fa9b3ac69a    SEQUENCE SET     b   SELECT pg_catalog.setval('public.project_references_78550f3c8c0211ed921d98fa9b3ac69a', 12, true);
          public          taiga    false    256            >           0    0 3   project_references_785dc08c8c0211ed921d98fa9b3ac69a    SEQUENCE SET     b   SELECT pg_catalog.setval('public.project_references_785dc08c8c0211ed921d98fa9b3ac69a', 12, true);
          public          taiga    false    257            ?           0    0 3   project_references_786475088c0211ed921d98fa9b3ac69a    SEQUENCE SET     b   SELECT pg_catalog.setval('public.project_references_786475088c0211ed921d98fa9b3ac69a', 23, true);
          public          taiga    false    258            @           0    0 3   project_references_786d19a68c0211ed921d98fa9b3ac69a    SEQUENCE SET     b   SELECT pg_catalog.setval('public.project_references_786d19a68c0211ed921d98fa9b3ac69a', 13, true);
          public          taiga    false    259            A           0    0 3   project_references_7875c97a8c0211ed921d98fa9b3ac69a    SEQUENCE SET     b   SELECT pg_catalog.setval('public.project_references_7875c97a8c0211ed921d98fa9b3ac69a', 29, true);
          public          taiga    false    260            B           0    0 3   project_references_787bbc688c0211ed921d98fa9b3ac69a    SEQUENCE SET     b   SELECT pg_catalog.setval('public.project_references_787bbc688c0211ed921d98fa9b3ac69a', 1, false);
          public          taiga    false    261            C           0    0 3   project_references_78809db48c0211ed921d98fa9b3ac69a    SEQUENCE SET     b   SELECT pg_catalog.setval('public.project_references_78809db48c0211ed921d98fa9b3ac69a', 22, true);
          public          taiga    false    262            D           0    0 3   project_references_7889b3688c0211ed921d98fa9b3ac69a    SEQUENCE SET     a   SELECT pg_catalog.setval('public.project_references_7889b3688c0211ed921d98fa9b3ac69a', 6, true);
          public          taiga    false    263            E           0    0 3   project_references_7d13504c8c0211ed921d98fa9b3ac69a    SEQUENCE SET     b   SELECT pg_catalog.setval('public.project_references_7d13504c8c0211ed921d98fa9b3ac69a', 1, false);
          public          taiga    false    264            F           0    0 3   project_references_7d1881ca8c0211ed921d98fa9b3ac69a    SEQUENCE SET     b   SELECT pg_catalog.setval('public.project_references_7d1881ca8c0211ed921d98fa9b3ac69a', 1, false);
          public          taiga    false    265            G           0    0 3   project_references_7d201bb08c0211ed921d98fa9b3ac69a    SEQUENCE SET     b   SELECT pg_catalog.setval('public.project_references_7d201bb08c0211ed921d98fa9b3ac69a', 1, false);
          public          taiga    false    266            H           0    0 3   project_references_7d7c57548c0211ed921d98fa9b3ac69a    SEQUENCE SET     b   SELECT pg_catalog.setval('public.project_references_7d7c57548c0211ed921d98fa9b3ac69a', 1, false);
          public          taiga    false    267            I           0    0 3   project_references_7d8149b28c0211ed921d98fa9b3ac69a    SEQUENCE SET     b   SELECT pg_catalog.setval('public.project_references_7d8149b28c0211ed921d98fa9b3ac69a', 1, false);
          public          taiga    false    268            J           0    0 3   project_references_7d86c0728c0211ed921d98fa9b3ac69a    SEQUENCE SET     b   SELECT pg_catalog.setval('public.project_references_7d86c0728c0211ed921d98fa9b3ac69a', 1, false);
          public          taiga    false    269            K           0    0 3   project_references_7d8b2cde8c0211ed921d98fa9b3ac69a    SEQUENCE SET     b   SELECT pg_catalog.setval('public.project_references_7d8b2cde8c0211ed921d98fa9b3ac69a', 1, false);
          public          taiga    false    270            L           0    0 3   project_references_7d8ff1e28c0211ed921d98fa9b3ac69a    SEQUENCE SET     b   SELECT pg_catalog.setval('public.project_references_7d8ff1e28c0211ed921d98fa9b3ac69a', 1, false);
          public          taiga    false    271            M           0    0 3   project_references_7d94ef628c0211ed921d98fa9b3ac69a    SEQUENCE SET     b   SELECT pg_catalog.setval('public.project_references_7d94ef628c0211ed921d98fa9b3ac69a', 1, false);
          public          taiga    false    272            N           0    0 3   project_references_7d9bc6348c0211ed921d98fa9b3ac69a    SEQUENCE SET     b   SELECT pg_catalog.setval('public.project_references_7d9bc6348c0211ed921d98fa9b3ac69a', 1, false);
          public          taiga    false    273            O           0    0 3   project_references_7da2cba08c0211ed921d98fa9b3ac69a    SEQUENCE SET     b   SELECT pg_catalog.setval('public.project_references_7da2cba08c0211ed921d98fa9b3ac69a', 1, false);
          public          taiga    false    274            P           0    0 3   project_references_7da8a3d68c0211ed921d98fa9b3ac69a    SEQUENCE SET     b   SELECT pg_catalog.setval('public.project_references_7da8a3d68c0211ed921d98fa9b3ac69a', 1, false);
          public          taiga    false    275            Q           0    0 3   project_references_7dad51248c0211ed921d98fa9b3ac69a    SEQUENCE SET     b   SELECT pg_catalog.setval('public.project_references_7dad51248c0211ed921d98fa9b3ac69a', 1, false);
          public          taiga    false    276            R           0    0 3   project_references_7db5afc28c0211ed921d98fa9b3ac69a    SEQUENCE SET     b   SELECT pg_catalog.setval('public.project_references_7db5afc28c0211ed921d98fa9b3ac69a', 1, false);
          public          taiga    false    277            S           0    0 3   project_references_7dbb6b428c0211ed921d98fa9b3ac69a    SEQUENCE SET     b   SELECT pg_catalog.setval('public.project_references_7dbb6b428c0211ed921d98fa9b3ac69a', 1, false);
          public          taiga    false    278            T           0    0 3   project_references_7dc6a76e8c0211ed921d98fa9b3ac69a    SEQUENCE SET     b   SELECT pg_catalog.setval('public.project_references_7dc6a76e8c0211ed921d98fa9b3ac69a', 1, false);
          public          taiga    false    279            U           0    0 3   project_references_7dcc99448c0211ed921d98fa9b3ac69a    SEQUENCE SET     b   SELECT pg_catalog.setval('public.project_references_7dcc99448c0211ed921d98fa9b3ac69a', 1, false);
          public          taiga    false    280            V           0    0 3   project_references_7dd216da8c0211ed921d98fa9b3ac69a    SEQUENCE SET     b   SELECT pg_catalog.setval('public.project_references_7dd216da8c0211ed921d98fa9b3ac69a', 1, false);
          public          taiga    false    281            W           0    0 3   project_references_7dd724f48c0211ed921d98fa9b3ac69a    SEQUENCE SET     b   SELECT pg_catalog.setval('public.project_references_7dd724f48c0211ed921d98fa9b3ac69a', 1, false);
          public          taiga    false    282            X           0    0 3   project_references_7ddfa7d28c0211ed921d98fa9b3ac69a    SEQUENCE SET     b   SELECT pg_catalog.setval('public.project_references_7ddfa7d28c0211ed921d98fa9b3ac69a', 1, false);
          public          taiga    false    283            Y           0    0 3   project_references_7de67ed68c0211ed921d98fa9b3ac69a    SEQUENCE SET     b   SELECT pg_catalog.setval('public.project_references_7de67ed68c0211ed921d98fa9b3ac69a', 1, false);
          public          taiga    false    284            Z           0    0 3   project_references_7ded18868c0211ed921d98fa9b3ac69a    SEQUENCE SET     b   SELECT pg_catalog.setval('public.project_references_7ded18868c0211ed921d98fa9b3ac69a', 1, false);
          public          taiga    false    285            [           0    0 3   project_references_7df75d008c0211ed921d98fa9b3ac69a    SEQUENCE SET     b   SELECT pg_catalog.setval('public.project_references_7df75d008c0211ed921d98fa9b3ac69a', 1, false);
          public          taiga    false    286            \           0    0 3   project_references_7e01e82e8c0211ed921d98fa9b3ac69a    SEQUENCE SET     b   SELECT pg_catalog.setval('public.project_references_7e01e82e8c0211ed921d98fa9b3ac69a', 1, false);
          public          taiga    false    287            ]           0    0 3   project_references_7e3e935a8c0211ed921d98fa9b3ac69a    SEQUENCE SET     b   SELECT pg_catalog.setval('public.project_references_7e3e935a8c0211ed921d98fa9b3ac69a', 1, false);
          public          taiga    false    288            ^           0    0 3   project_references_7e43889c8c0211ed921d98fa9b3ac69a    SEQUENCE SET     b   SELECT pg_catalog.setval('public.project_references_7e43889c8c0211ed921d98fa9b3ac69a', 1, false);
          public          taiga    false    289            _           0    0 3   project_references_7e48a5708c0211ed921d98fa9b3ac69a    SEQUENCE SET     b   SELECT pg_catalog.setval('public.project_references_7e48a5708c0211ed921d98fa9b3ac69a', 1, false);
          public          taiga    false    290            `           0    0 3   project_references_7e4e6ca88c0211ed921d98fa9b3ac69a    SEQUENCE SET     b   SELECT pg_catalog.setval('public.project_references_7e4e6ca88c0211ed921d98fa9b3ac69a', 1, false);
          public          taiga    false    291            a           0    0 3   project_references_7e53e2a08c0211ed921d98fa9b3ac69a    SEQUENCE SET     b   SELECT pg_catalog.setval('public.project_references_7e53e2a08c0211ed921d98fa9b3ac69a', 1, false);
          public          taiga    false    292            b           0    0 3   project_references_7e5b09ae8c0211ed921d98fa9b3ac69a    SEQUENCE SET     b   SELECT pg_catalog.setval('public.project_references_7e5b09ae8c0211ed921d98fa9b3ac69a', 1, false);
          public          taiga    false    293            c           0    0 3   project_references_7e61297e8c0211ed921d98fa9b3ac69a    SEQUENCE SET     b   SELECT pg_catalog.setval('public.project_references_7e61297e8c0211ed921d98fa9b3ac69a', 1, false);
          public          taiga    false    294            d           0    0 3   project_references_7e660d368c0211ed921d98fa9b3ac69a    SEQUENCE SET     b   SELECT pg_catalog.setval('public.project_references_7e660d368c0211ed921d98fa9b3ac69a', 1, false);
          public          taiga    false    295            e           0    0 3   project_references_7e6ae9468c0211ed921d98fa9b3ac69a    SEQUENCE SET     b   SELECT pg_catalog.setval('public.project_references_7e6ae9468c0211ed921d98fa9b3ac69a', 1, false);
          public          taiga    false    296            f           0    0 3   project_references_7e702a148c0211ed921d98fa9b3ac69a    SEQUENCE SET     b   SELECT pg_catalog.setval('public.project_references_7e702a148c0211ed921d98fa9b3ac69a', 1, false);
          public          taiga    false    297            g           0    0 3   project_references_7ef03bb48c0211ed921d98fa9b3ac69a    SEQUENCE SET     b   SELECT pg_catalog.setval('public.project_references_7ef03bb48c0211ed921d98fa9b3ac69a', 1, false);
          public          taiga    false    298            h           0    0 3   project_references_7f49490c8c0211ed921d98fa9b3ac69a    SEQUENCE SET     b   SELECT pg_catalog.setval('public.project_references_7f49490c8c0211ed921d98fa9b3ac69a', 1, false);
          public          taiga    false    299            i           0    0 3   project_references_7f4e90ec8c0211ed921d98fa9b3ac69a    SEQUENCE SET     d   SELECT pg_catalog.setval('public.project_references_7f4e90ec8c0211ed921d98fa9b3ac69a', 1000, true);
          public          taiga    false    300            j           0    0 3   project_references_8a10b85c8c0211ed921d98fa9b3ac69a    SEQUENCE SET     d   SELECT pg_catalog.setval('public.project_references_8a10b85c8c0211ed921d98fa9b3ac69a', 2000, true);
          public          taiga    false    301            k           0    0 3   project_references_8c6fc7388c0611edba2d98fa9b3ac69a    SEQUENCE SET     a   SELECT pg_catalog.setval('public.project_references_8c6fc7388c0611edba2d98fa9b3ac69a', 2, true);
          public          taiga    false    303            l           0    0 3   project_references_8e337a4c8c0611edba2d98fa9b3ac69a    SEQUENCE SET     b   SELECT pg_catalog.setval('public.project_references_8e337a4c8c0611edba2d98fa9b3ac69a', 1, false);
          public          taiga    false    304            m           0    0 3   project_references_8ee1e3de8c0611edba2d98fa9b3ac69a    SEQUENCE SET     b   SELECT pg_catalog.setval('public.project_references_8ee1e3de8c0611edba2d98fa9b3ac69a', 1, false);
          public          taiga    false    305            n           0    0 3   project_references_9009f17a8c0611edba2d98fa9b3ac69a    SEQUENCE SET     b   SELECT pg_catalog.setval('public.project_references_9009f17a8c0611edba2d98fa9b3ac69a', 1, false);
          public          taiga    false    306            o           0    0 3   project_references_910e640a8c0811ed8d7d98fa9b3ac69a    SEQUENCE SET     a   SELECT pg_catalog.setval('public.project_references_910e640a8c0811ed8d7d98fa9b3ac69a', 2, true);
          public          taiga    false    321            p           0    0 3   project_references_91e79b148c0611edba2d98fa9b3ac69a    SEQUENCE SET     b   SELECT pg_catalog.setval('public.project_references_91e79b148c0611edba2d98fa9b3ac69a', 1, false);
          public          taiga    false    307            q           0    0 3   project_references_92b342be8c0611edba2d98fa9b3ac69a    SEQUENCE SET     b   SELECT pg_catalog.setval('public.project_references_92b342be8c0611edba2d98fa9b3ac69a', 1, false);
          public          taiga    false    308            r           0    0 3   project_references_933915ea8c0811ed8d7d98fa9b3ac69a    SEQUENCE SET     b   SELECT pg_catalog.setval('public.project_references_933915ea8c0811ed8d7d98fa9b3ac69a', 1, false);
          public          taiga    false    322            s           0    0 3   project_references_93e0c4168c0811ed8d7d98fa9b3ac69a    SEQUENCE SET     b   SELECT pg_catalog.setval('public.project_references_93e0c4168c0811ed8d7d98fa9b3ac69a', 1, false);
          public          taiga    false    323            t           0    0 3   project_references_94fb50a08c0811ed8d7d98fa9b3ac69a    SEQUENCE SET     b   SELECT pg_catalog.setval('public.project_references_94fb50a08c0811ed8d7d98fa9b3ac69a', 1, false);
          public          taiga    false    324            u           0    0 3   project_references_96c415ac8c0811ed8d7d98fa9b3ac69a    SEQUENCE SET     b   SELECT pg_catalog.setval('public.project_references_96c415ac8c0811ed8d7d98fa9b3ac69a', 1, false);
          public          taiga    false    325            v           0    0 3   project_references_97a4c5168c0811ed8d7d98fa9b3ac69a    SEQUENCE SET     b   SELECT pg_catalog.setval('public.project_references_97a4c5168c0811ed8d7d98fa9b3ac69a', 1, false);
          public          taiga    false    326            w           0    0 3   project_references_a2efe6c28c0211ed8a2998fa9b3ac69a    SEQUENCE SET     a   SELECT pg_catalog.setval('public.project_references_a2efe6c28c0211ed8a2998fa9b3ac69a', 1, true);
          public          taiga    false    302            x           0    0 3   project_references_a3d67c468c0611edba2d98fa9b3ac69a    SEQUENCE SET     a   SELECT pg_catalog.setval('public.project_references_a3d67c468c0611edba2d98fa9b3ac69a', 2, true);
          public          taiga    false    309            y           0    0 3   project_references_a5a0cde28c0611edba2d98fa9b3ac69a    SEQUENCE SET     b   SELECT pg_catalog.setval('public.project_references_a5a0cde28c0611edba2d98fa9b3ac69a', 1, false);
          public          taiga    false    310            z           0    0 3   project_references_a64a1a8c8c0611edba2d98fa9b3ac69a    SEQUENCE SET     b   SELECT pg_catalog.setval('public.project_references_a64a1a8c8c0611edba2d98fa9b3ac69a', 1, false);
          public          taiga    false    311            {           0    0 3   project_references_a761ca468c0611edba2d98fa9b3ac69a    SEQUENCE SET     b   SELECT pg_catalog.setval('public.project_references_a761ca468c0611edba2d98fa9b3ac69a', 1, false);
          public          taiga    false    312            |           0    0 3   project_references_a906d13e8c0611edba2d98fa9b3ac69a    SEQUENCE SET     b   SELECT pg_catalog.setval('public.project_references_a906d13e8c0611edba2d98fa9b3ac69a', 1, false);
          public          taiga    false    313            }           0    0 3   project_references_a9d5efbe8c0611edba2d98fa9b3ac69a    SEQUENCE SET     b   SELECT pg_catalog.setval('public.project_references_a9d5efbe8c0611edba2d98fa9b3ac69a', 1, false);
          public          taiga    false    314            ~           0    0 3   project_references_b54b88548c0611edba2d98fa9b3ac69a    SEQUENCE SET     a   SELECT pg_catalog.setval('public.project_references_b54b88548c0611edba2d98fa9b3ac69a', 2, true);
          public          taiga    false    315                       0    0 3   project_references_b70544968c0611edba2d98fa9b3ac69a    SEQUENCE SET     b   SELECT pg_catalog.setval('public.project_references_b70544968c0611edba2d98fa9b3ac69a', 1, false);
          public          taiga    false    316            �           0    0 3   project_references_b7af78628c0611edba2d98fa9b3ac69a    SEQUENCE SET     b   SELECT pg_catalog.setval('public.project_references_b7af78628c0611edba2d98fa9b3ac69a', 1, false);
          public          taiga    false    317            �           0    0 3   project_references_b8d0dad88c0611edba2d98fa9b3ac69a    SEQUENCE SET     b   SELECT pg_catalog.setval('public.project_references_b8d0dad88c0611edba2d98fa9b3ac69a', 1, false);
          public          taiga    false    318            �           0    0 3   project_references_ba7814a08c0611edba2d98fa9b3ac69a    SEQUENCE SET     b   SELECT pg_catalog.setval('public.project_references_ba7814a08c0611edba2d98fa9b3ac69a', 1, false);
          public          taiga    false    319            �           0    0 3   project_references_bb485eee8c0611edba2d98fa9b3ac69a    SEQUENCE SET     b   SELECT pg_catalog.setval('public.project_references_bb485eee8c0611edba2d98fa9b3ac69a', 1, false);
          public          taiga    false    320            ]           2606    7770807    auth_group auth_group_name_key 
   CONSTRAINT     Y   ALTER TABLE ONLY public.auth_group
    ADD CONSTRAINT auth_group_name_key UNIQUE (name);
 H   ALTER TABLE ONLY public.auth_group DROP CONSTRAINT auth_group_name_key;
       public            taiga    false    214            b           2606    7770793 R   auth_group_permissions auth_group_permissions_group_id_permission_id_0cd325b0_uniq 
   CONSTRAINT     �   ALTER TABLE ONLY public.auth_group_permissions
    ADD CONSTRAINT auth_group_permissions_group_id_permission_id_0cd325b0_uniq UNIQUE (group_id, permission_id);
 |   ALTER TABLE ONLY public.auth_group_permissions DROP CONSTRAINT auth_group_permissions_group_id_permission_id_0cd325b0_uniq;
       public            taiga    false    216    216            e           2606    7770782 2   auth_group_permissions auth_group_permissions_pkey 
   CONSTRAINT     p   ALTER TABLE ONLY public.auth_group_permissions
    ADD CONSTRAINT auth_group_permissions_pkey PRIMARY KEY (id);
 \   ALTER TABLE ONLY public.auth_group_permissions DROP CONSTRAINT auth_group_permissions_pkey;
       public            taiga    false    216            _           2606    7770773    auth_group auth_group_pkey 
   CONSTRAINT     X   ALTER TABLE ONLY public.auth_group
    ADD CONSTRAINT auth_group_pkey PRIMARY KEY (id);
 D   ALTER TABLE ONLY public.auth_group DROP CONSTRAINT auth_group_pkey;
       public            taiga    false    214            X           2606    7770784 F   auth_permission auth_permission_content_type_id_codename_01ab375a_uniq 
   CONSTRAINT     �   ALTER TABLE ONLY public.auth_permission
    ADD CONSTRAINT auth_permission_content_type_id_codename_01ab375a_uniq UNIQUE (content_type_id, codename);
 p   ALTER TABLE ONLY public.auth_permission DROP CONSTRAINT auth_permission_content_type_id_codename_01ab375a_uniq;
       public            taiga    false    212    212            Z           2606    7770766 $   auth_permission auth_permission_pkey 
   CONSTRAINT     b   ALTER TABLE ONLY public.auth_permission
    ADD CONSTRAINT auth_permission_pkey PRIMARY KEY (id);
 N   ALTER TABLE ONLY public.auth_permission DROP CONSTRAINT auth_permission_pkey;
       public            taiga    false    212            T           2606    7770747 &   django_admin_log django_admin_log_pkey 
   CONSTRAINT     d   ALTER TABLE ONLY public.django_admin_log
    ADD CONSTRAINT django_admin_log_pkey PRIMARY KEY (id);
 P   ALTER TABLE ONLY public.django_admin_log DROP CONSTRAINT django_admin_log_pkey;
       public            taiga    false    210            O           2606    7770736 E   django_content_type django_content_type_app_label_model_76bd3d3b_uniq 
   CONSTRAINT     �   ALTER TABLE ONLY public.django_content_type
    ADD CONSTRAINT django_content_type_app_label_model_76bd3d3b_uniq UNIQUE (app_label, model);
 o   ALTER TABLE ONLY public.django_content_type DROP CONSTRAINT django_content_type_app_label_model_76bd3d3b_uniq;
       public            taiga    false    208    208            Q           2606    7770734 ,   django_content_type django_content_type_pkey 
   CONSTRAINT     j   ALTER TABLE ONLY public.django_content_type
    ADD CONSTRAINT django_content_type_pkey PRIMARY KEY (id);
 V   ALTER TABLE ONLY public.django_content_type DROP CONSTRAINT django_content_type_pkey;
       public            taiga    false    208            ;           2606    7770692 (   django_migrations django_migrations_pkey 
   CONSTRAINT     f   ALTER TABLE ONLY public.django_migrations
    ADD CONSTRAINT django_migrations_pkey PRIMARY KEY (id);
 R   ALTER TABLE ONLY public.django_migrations DROP CONSTRAINT django_migrations_pkey;
       public            taiga    false    204            �           2606    7771003 "   django_session django_session_pkey 
   CONSTRAINT     i   ALTER TABLE ONLY public.django_session
    ADD CONSTRAINT django_session_pkey PRIMARY KEY (session_key);
 L   ALTER TABLE ONLY public.django_session DROP CONSTRAINT django_session_pkey;
       public            taiga    false    229            i           2606    7770823 2   easy_thumbnails_source easy_thumbnails_source_pkey 
   CONSTRAINT     p   ALTER TABLE ONLY public.easy_thumbnails_source
    ADD CONSTRAINT easy_thumbnails_source_pkey PRIMARY KEY (id);
 \   ALTER TABLE ONLY public.easy_thumbnails_source DROP CONSTRAINT easy_thumbnails_source_pkey;
       public            taiga    false    218            m           2606    7770834 M   easy_thumbnails_source easy_thumbnails_source_storage_hash_name_481ce32d_uniq 
   CONSTRAINT     �   ALTER TABLE ONLY public.easy_thumbnails_source
    ADD CONSTRAINT easy_thumbnails_source_storage_hash_name_481ce32d_uniq UNIQUE (storage_hash, name);
 w   ALTER TABLE ONLY public.easy_thumbnails_source DROP CONSTRAINT easy_thumbnails_source_storage_hash_name_481ce32d_uniq;
       public            taiga    false    218    218            o           2606    7770832 Y   easy_thumbnails_thumbnail easy_thumbnails_thumbnai_storage_hash_name_source_fb375270_uniq 
   CONSTRAINT     �   ALTER TABLE ONLY public.easy_thumbnails_thumbnail
    ADD CONSTRAINT easy_thumbnails_thumbnai_storage_hash_name_source_fb375270_uniq UNIQUE (storage_hash, name, source_id);
 �   ALTER TABLE ONLY public.easy_thumbnails_thumbnail DROP CONSTRAINT easy_thumbnails_thumbnai_storage_hash_name_source_fb375270_uniq;
       public            taiga    false    220    220    220            s           2606    7770830 8   easy_thumbnails_thumbnail easy_thumbnails_thumbnail_pkey 
   CONSTRAINT     v   ALTER TABLE ONLY public.easy_thumbnails_thumbnail
    ADD CONSTRAINT easy_thumbnails_thumbnail_pkey PRIMARY KEY (id);
 b   ALTER TABLE ONLY public.easy_thumbnails_thumbnail DROP CONSTRAINT easy_thumbnails_thumbnail_pkey;
       public            taiga    false    220            x           2606    7770857 L   easy_thumbnails_thumbnaildimensions easy_thumbnails_thumbnaildimensions_pkey 
   CONSTRAINT     �   ALTER TABLE ONLY public.easy_thumbnails_thumbnaildimensions
    ADD CONSTRAINT easy_thumbnails_thumbnaildimensions_pkey PRIMARY KEY (id);
 v   ALTER TABLE ONLY public.easy_thumbnails_thumbnaildimensions DROP CONSTRAINT easy_thumbnails_thumbnaildimensions_pkey;
       public            taiga    false    222            z           2606    7770859 X   easy_thumbnails_thumbnaildimensions easy_thumbnails_thumbnaildimensions_thumbnail_id_key 
   CONSTRAINT     �   ALTER TABLE ONLY public.easy_thumbnails_thumbnaildimensions
    ADD CONSTRAINT easy_thumbnails_thumbnaildimensions_thumbnail_id_key UNIQUE (thumbnail_id);
 �   ALTER TABLE ONLY public.easy_thumbnails_thumbnaildimensions DROP CONSTRAINT easy_thumbnails_thumbnaildimensions_thumbnail_id_key;
       public            taiga    false    222            �           2606    7771247 .   procrastinate_events procrastinate_events_pkey 
   CONSTRAINT     l   ALTER TABLE ONLY public.procrastinate_events
    ADD CONSTRAINT procrastinate_events_pkey PRIMARY KEY (id);
 X   ALTER TABLE ONLY public.procrastinate_events DROP CONSTRAINT procrastinate_events_pkey;
       public            taiga    false    243            �           2606    7771222 *   procrastinate_jobs procrastinate_jobs_pkey 
   CONSTRAINT     h   ALTER TABLE ONLY public.procrastinate_jobs
    ADD CONSTRAINT procrastinate_jobs_pkey PRIMARY KEY (id);
 T   ALTER TABLE ONLY public.procrastinate_jobs DROP CONSTRAINT procrastinate_jobs_pkey;
       public            taiga    false    239            �           2606    7771231 @   procrastinate_periodic_defers procrastinate_periodic_defers_pkey 
   CONSTRAINT     ~   ALTER TABLE ONLY public.procrastinate_periodic_defers
    ADD CONSTRAINT procrastinate_periodic_defers_pkey PRIMARY KEY (id);
 j   ALTER TABLE ONLY public.procrastinate_periodic_defers DROP CONSTRAINT procrastinate_periodic_defers_pkey;
       public            taiga    false    241            �           2606    7771233 B   procrastinate_periodic_defers procrastinate_periodic_defers_unique 
   CONSTRAINT     �   ALTER TABLE ONLY public.procrastinate_periodic_defers
    ADD CONSTRAINT procrastinate_periodic_defers_unique UNIQUE (task_name, periodic_id, defer_timestamp);
 l   ALTER TABLE ONLY public.procrastinate_periodic_defers DROP CONSTRAINT procrastinate_periodic_defers_unique;
       public            taiga    false    241    241    241            �           2606    7770954 R   projects_invitations_projectinvitation projects_invitations_projectinvitation_pkey 
   CONSTRAINT     �   ALTER TABLE ONLY public.projects_invitations_projectinvitation
    ADD CONSTRAINT projects_invitations_projectinvitation_pkey PRIMARY KEY (id);
 |   ALTER TABLE ONLY public.projects_invitations_projectinvitation DROP CONSTRAINT projects_invitations_projectinvitation_pkey;
       public            taiga    false    228            �           2606    7770959 b   projects_invitations_projectinvitation projects_invitations_projectinvitation_unique_project_email 
   CONSTRAINT     �   ALTER TABLE ONLY public.projects_invitations_projectinvitation
    ADD CONSTRAINT projects_invitations_projectinvitation_unique_project_email UNIQUE (project_id, email);
 �   ALTER TABLE ONLY public.projects_invitations_projectinvitation DROP CONSTRAINT projects_invitations_projectinvitation_unique_project_email;
       public            taiga    false    228    228            �           2606    7770915 R   projects_memberships_projectmembership projects_memberships_projectmembership_pkey 
   CONSTRAINT     �   ALTER TABLE ONLY public.projects_memberships_projectmembership
    ADD CONSTRAINT projects_memberships_projectmembership_pkey PRIMARY KEY (id);
 |   ALTER TABLE ONLY public.projects_memberships_projectmembership DROP CONSTRAINT projects_memberships_projectmembership_pkey;
       public            taiga    false    227            �           2606    7770918 a   projects_memberships_projectmembership projects_memberships_projectmembership_unique_project_user 
   CONSTRAINT     �   ALTER TABLE ONLY public.projects_memberships_projectmembership
    ADD CONSTRAINT projects_memberships_projectmembership_unique_project_user UNIQUE (project_id, user_id);
 �   ALTER TABLE ONLY public.projects_memberships_projectmembership DROP CONSTRAINT projects_memberships_projectmembership_unique_project_user;
       public            taiga    false    227    227            �           2606    7770877 &   projects_project projects_project_pkey 
   CONSTRAINT     d   ALTER TABLE ONLY public.projects_project
    ADD CONSTRAINT projects_project_pkey PRIMARY KEY (id);
 P   ALTER TABLE ONLY public.projects_project DROP CONSTRAINT projects_project_pkey;
       public            taiga    false    224            �           2606    7770885 6   projects_projecttemplate projects_projecttemplate_pkey 
   CONSTRAINT     t   ALTER TABLE ONLY public.projects_projecttemplate
    ADD CONSTRAINT projects_projecttemplate_pkey PRIMARY KEY (id);
 `   ALTER TABLE ONLY public.projects_projecttemplate DROP CONSTRAINT projects_projecttemplate_pkey;
       public            taiga    false    225            �           2606    7770887 :   projects_projecttemplate projects_projecttemplate_slug_key 
   CONSTRAINT     u   ALTER TABLE ONLY public.projects_projecttemplate
    ADD CONSTRAINT projects_projecttemplate_slug_key UNIQUE (slug);
 d   ALTER TABLE ONLY public.projects_projecttemplate DROP CONSTRAINT projects_projecttemplate_slug_key;
       public            taiga    false    225            �           2606    7770897 :   projects_roles_projectrole projects_roles_projectrole_pkey 
   CONSTRAINT     x   ALTER TABLE ONLY public.projects_roles_projectrole
    ADD CONSTRAINT projects_roles_projectrole_pkey PRIMARY KEY (id);
 d   ALTER TABLE ONLY public.projects_roles_projectrole DROP CONSTRAINT projects_roles_projectrole_pkey;
       public            taiga    false    226            �           2606    7770902 I   projects_roles_projectrole projects_roles_projectrole_unique_project_name 
   CONSTRAINT     �   ALTER TABLE ONLY public.projects_roles_projectrole
    ADD CONSTRAINT projects_roles_projectrole_unique_project_name UNIQUE (project_id, name);
 s   ALTER TABLE ONLY public.projects_roles_projectrole DROP CONSTRAINT projects_roles_projectrole_unique_project_name;
       public            taiga    false    226    226            �           2606    7770900 I   projects_roles_projectrole projects_roles_projectrole_unique_project_slug 
   CONSTRAINT     �   ALTER TABLE ONLY public.projects_roles_projectrole
    ADD CONSTRAINT projects_roles_projectrole_unique_project_slug UNIQUE (project_id, slug);
 s   ALTER TABLE ONLY public.projects_roles_projectrole DROP CONSTRAINT projects_roles_projectrole_unique_project_slug;
       public            taiga    false    226    226            �           2606    7771092 "   stories_story projects_unique_refs 
   CONSTRAINT     h   ALTER TABLE ONLY public.stories_story
    ADD CONSTRAINT projects_unique_refs UNIQUE (project_id, ref);
 L   ALTER TABLE ONLY public.stories_story DROP CONSTRAINT projects_unique_refs;
       public            taiga    false    232    232            �           2606    7771054 (   stories_assignees stories_assignees_pkey 
   CONSTRAINT     f   ALTER TABLE ONLY public.stories_assignees
    ADD CONSTRAINT stories_assignees_pkey PRIMARY KEY (id);
 R   ALTER TABLE ONLY public.stories_assignees DROP CONSTRAINT stories_assignees_pkey;
       public            taiga    false    233            �           2606    7771057 C   stories_assignees stories_assignees_storyassignee_unique_story_user 
   CONSTRAINT     �   ALTER TABLE ONLY public.stories_assignees
    ADD CONSTRAINT stories_assignees_storyassignee_unique_story_user UNIQUE (story_id, user_id);
 m   ALTER TABLE ONLY public.stories_assignees DROP CONSTRAINT stories_assignees_storyassignee_unique_story_user;
       public            taiga    false    233    233            �           2606    7771048     stories_story stories_story_pkey 
   CONSTRAINT     ^   ALTER TABLE ONLY public.stories_story
    ADD CONSTRAINT stories_story_pkey PRIMARY KEY (id);
 J   ALTER TABLE ONLY public.stories_story DROP CONSTRAINT stories_story_pkey;
       public            taiga    false    232            �           2606    7771111 2   tokens_denylistedtoken tokens_denylistedtoken_pkey 
   CONSTRAINT     p   ALTER TABLE ONLY public.tokens_denylistedtoken
    ADD CONSTRAINT tokens_denylistedtoken_pkey PRIMARY KEY (id);
 \   ALTER TABLE ONLY public.tokens_denylistedtoken DROP CONSTRAINT tokens_denylistedtoken_pkey;
       public            taiga    false    235            �           2606    7771113 :   tokens_denylistedtoken tokens_denylistedtoken_token_id_key 
   CONSTRAINT     y   ALTER TABLE ONLY public.tokens_denylistedtoken
    ADD CONSTRAINT tokens_denylistedtoken_token_id_key UNIQUE (token_id);
 d   ALTER TABLE ONLY public.tokens_denylistedtoken DROP CONSTRAINT tokens_denylistedtoken_token_id_key;
       public            taiga    false    235            �           2606    7771106 7   tokens_outstandingtoken tokens_outstandingtoken_jti_key 
   CONSTRAINT     q   ALTER TABLE ONLY public.tokens_outstandingtoken
    ADD CONSTRAINT tokens_outstandingtoken_jti_key UNIQUE (jti);
 a   ALTER TABLE ONLY public.tokens_outstandingtoken DROP CONSTRAINT tokens_outstandingtoken_jti_key;
       public            taiga    false    234            �           2606    7771104 4   tokens_outstandingtoken tokens_outstandingtoken_pkey 
   CONSTRAINT     r   ALTER TABLE ONLY public.tokens_outstandingtoken
    ADD CONSTRAINT tokens_outstandingtoken_pkey PRIMARY KEY (id);
 ^   ALTER TABLE ONLY public.tokens_outstandingtoken DROP CONSTRAINT tokens_outstandingtoken_pkey;
       public            taiga    false    234            J           2606    7770712 "   users_authdata users_authdata_pkey 
   CONSTRAINT     `   ALTER TABLE ONLY public.users_authdata
    ADD CONSTRAINT users_authdata_pkey PRIMARY KEY (id);
 L   ALTER TABLE ONLY public.users_authdata DROP CONSTRAINT users_authdata_pkey;
       public            taiga    false    206            L           2606    7770717 -   users_authdata users_authdata_unique_user_key 
   CONSTRAINT     p   ALTER TABLE ONLY public.users_authdata
    ADD CONSTRAINT users_authdata_unique_user_key UNIQUE (user_id, key);
 W   ALTER TABLE ONLY public.users_authdata DROP CONSTRAINT users_authdata_unique_user_key;
       public            taiga    false    206    206            ?           2606    7770704    users_user users_user_email_key 
   CONSTRAINT     [   ALTER TABLE ONLY public.users_user
    ADD CONSTRAINT users_user_email_key UNIQUE (email);
 I   ALTER TABLE ONLY public.users_user DROP CONSTRAINT users_user_email_key;
       public            taiga    false    205            A           2606    7770700    users_user users_user_pkey 
   CONSTRAINT     X   ALTER TABLE ONLY public.users_user
    ADD CONSTRAINT users_user_pkey PRIMARY KEY (id);
 D   ALTER TABLE ONLY public.users_user DROP CONSTRAINT users_user_pkey;
       public            taiga    false    205            E           2606    7770702 "   users_user users_user_username_key 
   CONSTRAINT     a   ALTER TABLE ONLY public.users_user
    ADD CONSTRAINT users_user_username_key UNIQUE (username);
 L   ALTER TABLE ONLY public.users_user DROP CONSTRAINT users_user_username_key;
       public            taiga    false    205            �           2606    7771013 *   workflows_workflow workflows_workflow_pkey 
   CONSTRAINT     h   ALTER TABLE ONLY public.workflows_workflow
    ADD CONSTRAINT workflows_workflow_pkey PRIMARY KEY (id);
 T   ALTER TABLE ONLY public.workflows_workflow DROP CONSTRAINT workflows_workflow_pkey;
       public            taiga    false    230            �           2606    7771027 9   workflows_workflow workflows_workflow_unique_project_name 
   CONSTRAINT     �   ALTER TABLE ONLY public.workflows_workflow
    ADD CONSTRAINT workflows_workflow_unique_project_name UNIQUE (project_id, name);
 c   ALTER TABLE ONLY public.workflows_workflow DROP CONSTRAINT workflows_workflow_unique_project_name;
       public            taiga    false    230    230            �           2606    7771025 9   workflows_workflow workflows_workflow_unique_project_slug 
   CONSTRAINT     �   ALTER TABLE ONLY public.workflows_workflow
    ADD CONSTRAINT workflows_workflow_unique_project_slug UNIQUE (project_id, slug);
 c   ALTER TABLE ONLY public.workflows_workflow DROP CONSTRAINT workflows_workflow_unique_project_slug;
       public            taiga    false    230    230            �           2606    7771021 6   workflows_workflowstatus workflows_workflowstatus_pkey 
   CONSTRAINT     t   ALTER TABLE ONLY public.workflows_workflowstatus
    ADD CONSTRAINT workflows_workflowstatus_pkey PRIMARY KEY (id);
 `   ALTER TABLE ONLY public.workflows_workflowstatus DROP CONSTRAINT workflows_workflowstatus_pkey;
       public            taiga    false    231            �           2606    7771155 Z   workspaces_memberships_workspacemembership workspaces_memberships_workspacemembership_pkey 
   CONSTRAINT     �   ALTER TABLE ONLY public.workspaces_memberships_workspacemembership
    ADD CONSTRAINT workspaces_memberships_workspacemembership_pkey PRIMARY KEY (id);
 �   ALTER TABLE ONLY public.workspaces_memberships_workspacemembership DROP CONSTRAINT workspaces_memberships_workspacemembership_pkey;
       public            taiga    false    237            �           2606    7771158 j   workspaces_memberships_workspacemembership workspaces_memberships_workspacemembership_unique_workspace_use 
   CONSTRAINT     �   ALTER TABLE ONLY public.workspaces_memberships_workspacemembership
    ADD CONSTRAINT workspaces_memberships_workspacemembership_unique_workspace_use UNIQUE (workspace_id, user_id);
 �   ALTER TABLE ONLY public.workspaces_memberships_workspacemembership DROP CONSTRAINT workspaces_memberships_workspacemembership_unique_workspace_use;
       public            taiga    false    237    237            �           2606    7771137 B   workspaces_roles_workspacerole workspaces_roles_workspacerole_pkey 
   CONSTRAINT     �   ALTER TABLE ONLY public.workspaces_roles_workspacerole
    ADD CONSTRAINT workspaces_roles_workspacerole_pkey PRIMARY KEY (id);
 l   ALTER TABLE ONLY public.workspaces_roles_workspacerole DROP CONSTRAINT workspaces_roles_workspacerole_pkey;
       public            taiga    false    236            �           2606    7771142 S   workspaces_roles_workspacerole workspaces_roles_workspacerole_unique_workspace_name 
   CONSTRAINT     �   ALTER TABLE ONLY public.workspaces_roles_workspacerole
    ADD CONSTRAINT workspaces_roles_workspacerole_unique_workspace_name UNIQUE (workspace_id, name);
 }   ALTER TABLE ONLY public.workspaces_roles_workspacerole DROP CONSTRAINT workspaces_roles_workspacerole_unique_workspace_name;
       public            taiga    false    236    236            �           2606    7771140 S   workspaces_roles_workspacerole workspaces_roles_workspacerole_unique_workspace_slug 
   CONSTRAINT     �   ALTER TABLE ONLY public.workspaces_roles_workspacerole
    ADD CONSTRAINT workspaces_roles_workspacerole_unique_workspace_slug UNIQUE (workspace_id, slug);
 }   ALTER TABLE ONLY public.workspaces_roles_workspacerole DROP CONSTRAINT workspaces_roles_workspacerole_unique_workspace_slug;
       public            taiga    false    236    236            }           2606    7770869 .   workspaces_workspace workspaces_workspace_pkey 
   CONSTRAINT     l   ALTER TABLE ONLY public.workspaces_workspace
    ADD CONSTRAINT workspaces_workspace_pkey PRIMARY KEY (id);
 X   ALTER TABLE ONLY public.workspaces_workspace DROP CONSTRAINT workspaces_workspace_pkey;
       public            taiga    false    223            [           1259    7770808    auth_group_name_a6ea08ec_like    INDEX     h   CREATE INDEX auth_group_name_a6ea08ec_like ON public.auth_group USING btree (name varchar_pattern_ops);
 1   DROP INDEX public.auth_group_name_a6ea08ec_like;
       public            taiga    false    214            `           1259    7770804 (   auth_group_permissions_group_id_b120cbf9    INDEX     o   CREATE INDEX auth_group_permissions_group_id_b120cbf9 ON public.auth_group_permissions USING btree (group_id);
 <   DROP INDEX public.auth_group_permissions_group_id_b120cbf9;
       public            taiga    false    216            c           1259    7770805 -   auth_group_permissions_permission_id_84c5c92e    INDEX     y   CREATE INDEX auth_group_permissions_permission_id_84c5c92e ON public.auth_group_permissions USING btree (permission_id);
 A   DROP INDEX public.auth_group_permissions_permission_id_84c5c92e;
       public            taiga    false    216            V           1259    7770790 (   auth_permission_content_type_id_2f476e4b    INDEX     o   CREATE INDEX auth_permission_content_type_id_2f476e4b ON public.auth_permission USING btree (content_type_id);
 <   DROP INDEX public.auth_permission_content_type_id_2f476e4b;
       public            taiga    false    212            R           1259    7770758 )   django_admin_log_content_type_id_c4bce8eb    INDEX     q   CREATE INDEX django_admin_log_content_type_id_c4bce8eb ON public.django_admin_log USING btree (content_type_id);
 =   DROP INDEX public.django_admin_log_content_type_id_c4bce8eb;
       public            taiga    false    210            U           1259    7770759 !   django_admin_log_user_id_c564eba6    INDEX     a   CREATE INDEX django_admin_log_user_id_c564eba6 ON public.django_admin_log USING btree (user_id);
 5   DROP INDEX public.django_admin_log_user_id_c564eba6;
       public            taiga    false    210            �           1259    7771005 #   django_session_expire_date_a5c62663    INDEX     e   CREATE INDEX django_session_expire_date_a5c62663 ON public.django_session USING btree (expire_date);
 7   DROP INDEX public.django_session_expire_date_a5c62663;
       public            taiga    false    229            �           1259    7771004 (   django_session_session_key_c0390e0f_like    INDEX     ~   CREATE INDEX django_session_session_key_c0390e0f_like ON public.django_session USING btree (session_key varchar_pattern_ops);
 <   DROP INDEX public.django_session_session_key_c0390e0f_like;
       public            taiga    false    229            f           1259    7770837 $   easy_thumbnails_source_name_5fe0edc6    INDEX     g   CREATE INDEX easy_thumbnails_source_name_5fe0edc6 ON public.easy_thumbnails_source USING btree (name);
 8   DROP INDEX public.easy_thumbnails_source_name_5fe0edc6;
       public            taiga    false    218            g           1259    7770838 )   easy_thumbnails_source_name_5fe0edc6_like    INDEX     �   CREATE INDEX easy_thumbnails_source_name_5fe0edc6_like ON public.easy_thumbnails_source USING btree (name varchar_pattern_ops);
 =   DROP INDEX public.easy_thumbnails_source_name_5fe0edc6_like;
       public            taiga    false    218            j           1259    7770835 ,   easy_thumbnails_source_storage_hash_946cbcc9    INDEX     w   CREATE INDEX easy_thumbnails_source_storage_hash_946cbcc9 ON public.easy_thumbnails_source USING btree (storage_hash);
 @   DROP INDEX public.easy_thumbnails_source_storage_hash_946cbcc9;
       public            taiga    false    218            k           1259    7770836 1   easy_thumbnails_source_storage_hash_946cbcc9_like    INDEX     �   CREATE INDEX easy_thumbnails_source_storage_hash_946cbcc9_like ON public.easy_thumbnails_source USING btree (storage_hash varchar_pattern_ops);
 E   DROP INDEX public.easy_thumbnails_source_storage_hash_946cbcc9_like;
       public            taiga    false    218            p           1259    7770846 '   easy_thumbnails_thumbnail_name_b5882c31    INDEX     m   CREATE INDEX easy_thumbnails_thumbnail_name_b5882c31 ON public.easy_thumbnails_thumbnail USING btree (name);
 ;   DROP INDEX public.easy_thumbnails_thumbnail_name_b5882c31;
       public            taiga    false    220            q           1259    7770847 ,   easy_thumbnails_thumbnail_name_b5882c31_like    INDEX     �   CREATE INDEX easy_thumbnails_thumbnail_name_b5882c31_like ON public.easy_thumbnails_thumbnail USING btree (name varchar_pattern_ops);
 @   DROP INDEX public.easy_thumbnails_thumbnail_name_b5882c31_like;
       public            taiga    false    220            t           1259    7770848 ,   easy_thumbnails_thumbnail_source_id_5b57bc77    INDEX     w   CREATE INDEX easy_thumbnails_thumbnail_source_id_5b57bc77 ON public.easy_thumbnails_thumbnail USING btree (source_id);
 @   DROP INDEX public.easy_thumbnails_thumbnail_source_id_5b57bc77;
       public            taiga    false    220            u           1259    7770844 /   easy_thumbnails_thumbnail_storage_hash_f1435f49    INDEX     }   CREATE INDEX easy_thumbnails_thumbnail_storage_hash_f1435f49 ON public.easy_thumbnails_thumbnail USING btree (storage_hash);
 C   DROP INDEX public.easy_thumbnails_thumbnail_storage_hash_f1435f49;
       public            taiga    false    220            v           1259    7770845 4   easy_thumbnails_thumbnail_storage_hash_f1435f49_like    INDEX     �   CREATE INDEX easy_thumbnails_thumbnail_storage_hash_f1435f49_like ON public.easy_thumbnails_thumbnail USING btree (storage_hash varchar_pattern_ops);
 H   DROP INDEX public.easy_thumbnails_thumbnail_storage_hash_f1435f49_like;
       public            taiga    false    220            �           1259    7771257     procrastinate_events_job_id_fkey    INDEX     c   CREATE INDEX procrastinate_events_job_id_fkey ON public.procrastinate_events USING btree (job_id);
 4   DROP INDEX public.procrastinate_events_job_id_fkey;
       public            taiga    false    243            �           1259    7771256    procrastinate_jobs_id_lock_idx    INDEX     �   CREATE INDEX procrastinate_jobs_id_lock_idx ON public.procrastinate_jobs USING btree (id, lock) WHERE (status = ANY (ARRAY['todo'::public.procrastinate_job_status, 'doing'::public.procrastinate_job_status]));
 2   DROP INDEX public.procrastinate_jobs_id_lock_idx;
       public            taiga    false    239    239    239    862            �           1259    7771254    procrastinate_jobs_lock_idx    INDEX     �   CREATE UNIQUE INDEX procrastinate_jobs_lock_idx ON public.procrastinate_jobs USING btree (lock) WHERE (status = 'doing'::public.procrastinate_job_status);
 /   DROP INDEX public.procrastinate_jobs_lock_idx;
       public            taiga    false    862    239    239            �           1259    7771255 !   procrastinate_jobs_queue_name_idx    INDEX     f   CREATE INDEX procrastinate_jobs_queue_name_idx ON public.procrastinate_jobs USING btree (queue_name);
 5   DROP INDEX public.procrastinate_jobs_queue_name_idx;
       public            taiga    false    239            �           1259    7771253 $   procrastinate_jobs_queueing_lock_idx    INDEX     �   CREATE UNIQUE INDEX procrastinate_jobs_queueing_lock_idx ON public.procrastinate_jobs USING btree (queueing_lock) WHERE (status = 'todo'::public.procrastinate_job_status);
 8   DROP INDEX public.procrastinate_jobs_queueing_lock_idx;
       public            taiga    false    239    862    239            �           1259    7771258 )   procrastinate_periodic_defers_job_id_fkey    INDEX     u   CREATE INDEX procrastinate_periodic_defers_job_id_fkey ON public.procrastinate_periodic_defers USING btree (job_id);
 =   DROP INDEX public.procrastinate_periodic_defers_job_id_fkey;
       public            taiga    false    241            �           1259    7770955    projects_in_email_07fdb9_idx    INDEX     p   CREATE INDEX projects_in_email_07fdb9_idx ON public.projects_invitations_projectinvitation USING btree (email);
 0   DROP INDEX public.projects_in_email_07fdb9_idx;
       public            taiga    false    228            �           1259    7770957    projects_in_project_ac92b3_idx    INDEX     �   CREATE INDEX projects_in_project_ac92b3_idx ON public.projects_invitations_projectinvitation USING btree (project_id, user_id);
 2   DROP INDEX public.projects_in_project_ac92b3_idx;
       public            taiga    false    228    228            �           1259    7770956    projects_in_project_d7d2d6_idx    INDEX     ~   CREATE INDEX projects_in_project_d7d2d6_idx ON public.projects_invitations_projectinvitation USING btree (project_id, email);
 2   DROP INDEX public.projects_in_project_d7d2d6_idx;
       public            taiga    false    228    228            �           1259    7770990 =   projects_invitations_projectinvitation_invited_by_id_e41218dc    INDEX     �   CREATE INDEX projects_invitations_projectinvitation_invited_by_id_e41218dc ON public.projects_invitations_projectinvitation USING btree (invited_by_id);
 Q   DROP INDEX public.projects_invitations_projectinvitation_invited_by_id_e41218dc;
       public            taiga    false    228            �           1259    7770991 :   projects_invitations_projectinvitation_project_id_8a729cae    INDEX     �   CREATE INDEX projects_invitations_projectinvitation_project_id_8a729cae ON public.projects_invitations_projectinvitation USING btree (project_id);
 N   DROP INDEX public.projects_invitations_projectinvitation_project_id_8a729cae;
       public            taiga    false    228            �           1259    7770992 <   projects_invitations_projectinvitation_resent_by_id_68c580e8    INDEX     �   CREATE INDEX projects_invitations_projectinvitation_resent_by_id_68c580e8 ON public.projects_invitations_projectinvitation USING btree (resent_by_id);
 P   DROP INDEX public.projects_invitations_projectinvitation_resent_by_id_68c580e8;
       public            taiga    false    228            �           1259    7770993 =   projects_invitations_projectinvitation_revoked_by_id_8a8e629a    INDEX     �   CREATE INDEX projects_invitations_projectinvitation_revoked_by_id_8a8e629a ON public.projects_invitations_projectinvitation USING btree (revoked_by_id);
 Q   DROP INDEX public.projects_invitations_projectinvitation_revoked_by_id_8a8e629a;
       public            taiga    false    228            �           1259    7770994 7   projects_invitations_projectinvitation_role_id_bb735b0e    INDEX     �   CREATE INDEX projects_invitations_projectinvitation_role_id_bb735b0e ON public.projects_invitations_projectinvitation USING btree (role_id);
 K   DROP INDEX public.projects_invitations_projectinvitation_role_id_bb735b0e;
       public            taiga    false    228            �           1259    7770995 7   projects_invitations_projectinvitation_user_id_995e9b1c    INDEX     �   CREATE INDEX projects_invitations_projectinvitation_user_id_995e9b1c ON public.projects_invitations_projectinvitation USING btree (user_id);
 K   DROP INDEX public.projects_invitations_projectinvitation_user_id_995e9b1c;
       public            taiga    false    228            �           1259    7770916    projects_me_project_3bd46e_idx    INDEX     �   CREATE INDEX projects_me_project_3bd46e_idx ON public.projects_memberships_projectmembership USING btree (project_id, user_id);
 2   DROP INDEX public.projects_me_project_3bd46e_idx;
       public            taiga    false    227    227            �           1259    7770934 :   projects_memberships_projectmembership_project_id_7592284f    INDEX     �   CREATE INDEX projects_memberships_projectmembership_project_id_7592284f ON public.projects_memberships_projectmembership USING btree (project_id);
 N   DROP INDEX public.projects_memberships_projectmembership_project_id_7592284f;
       public            taiga    false    227            �           1259    7770935 7   projects_memberships_projectmembership_role_id_43773f6c    INDEX     �   CREATE INDEX projects_memberships_projectmembership_role_id_43773f6c ON public.projects_memberships_projectmembership USING btree (role_id);
 K   DROP INDEX public.projects_memberships_projectmembership_role_id_43773f6c;
       public            taiga    false    227            �           1259    7770936 7   projects_memberships_projectmembership_user_id_8a613b51    INDEX     �   CREATE INDEX projects_memberships_projectmembership_user_id_8a613b51 ON public.projects_memberships_projectmembership USING btree (user_id);
 K   DROP INDEX public.projects_memberships_projectmembership_user_id_8a613b51;
       public            taiga    false    227            �           1259    7770888    projects_pr_slug_28d8d6_idx    INDEX     `   CREATE INDEX projects_pr_slug_28d8d6_idx ON public.projects_projecttemplate USING btree (slug);
 /   DROP INDEX public.projects_pr_slug_28d8d6_idx;
       public            taiga    false    225            ~           1259    7770948    projects_pr_workspa_2e7a5b_idx    INDEX     g   CREATE INDEX projects_pr_workspa_2e7a5b_idx ON public.projects_project USING btree (workspace_id, id);
 2   DROP INDEX public.projects_pr_workspa_2e7a5b_idx;
       public            taiga    false    224    224                       1259    7770942 "   projects_project_owner_id_b940de39    INDEX     c   CREATE INDEX projects_project_owner_id_b940de39 ON public.projects_project USING btree (owner_id);
 6   DROP INDEX public.projects_project_owner_id_b940de39;
       public            taiga    false    224            �           1259    7770949 &   projects_project_workspace_id_7ea54f67    INDEX     k   CREATE INDEX projects_project_workspace_id_7ea54f67 ON public.projects_project USING btree (workspace_id);
 :   DROP INDEX public.projects_project_workspace_id_7ea54f67;
       public            taiga    false    224            �           1259    7770889 +   projects_projecttemplate_slug_2731738e_like    INDEX     �   CREATE INDEX projects_projecttemplate_slug_2731738e_like ON public.projects_projecttemplate USING btree (slug varchar_pattern_ops);
 ?   DROP INDEX public.projects_projecttemplate_slug_2731738e_like;
       public            taiga    false    225            �           1259    7770898    projects_ro_project_63cac9_idx    INDEX     q   CREATE INDEX projects_ro_project_63cac9_idx ON public.projects_roles_projectrole USING btree (project_id, slug);
 2   DROP INDEX public.projects_ro_project_63cac9_idx;
       public            taiga    false    226    226            �           1259    7770910 .   projects_roles_projectrole_project_id_4efc0342    INDEX     {   CREATE INDEX projects_roles_projectrole_project_id_4efc0342 ON public.projects_roles_projectrole USING btree (project_id);
 B   DROP INDEX public.projects_roles_projectrole_project_id_4efc0342;
       public            taiga    false    226            �           1259    7770908 (   projects_roles_projectrole_slug_9eb663ce    INDEX     o   CREATE INDEX projects_roles_projectrole_slug_9eb663ce ON public.projects_roles_projectrole USING btree (slug);
 <   DROP INDEX public.projects_roles_projectrole_slug_9eb663ce;
       public            taiga    false    226            �           1259    7770909 -   projects_roles_projectrole_slug_9eb663ce_like    INDEX     �   CREATE INDEX projects_roles_projectrole_slug_9eb663ce_like ON public.projects_roles_projectrole USING btree (slug varchar_pattern_ops);
 A   DROP INDEX public.projects_roles_projectrole_slug_9eb663ce_like;
       public            taiga    false    226            �           1259    7771055    stories_ass_story_i_c20f0f_idx    INDEX     i   CREATE INDEX stories_ass_story_i_c20f0f_idx ON public.stories_assignees USING btree (story_id, user_id);
 2   DROP INDEX public.stories_ass_story_i_c20f0f_idx;
       public            taiga    false    233    233            �           1259    7771068 #   stories_assignees_story_id_61d41f62    INDEX     e   CREATE INDEX stories_assignees_story_id_61d41f62 ON public.stories_assignees USING btree (story_id);
 7   DROP INDEX public.stories_assignees_story_id_61d41f62;
       public            taiga    false    233            �           1259    7771069 "   stories_assignees_user_id_69fe3c4b    INDEX     c   CREATE INDEX stories_assignees_user_id_69fe3c4b ON public.stories_assignees USING btree (user_id);
 6   DROP INDEX public.stories_assignees_user_id_69fe3c4b;
       public            taiga    false    233            �           1259    7771090    stories_sto_project_840ba5_idx    INDEX     c   CREATE INDEX stories_sto_project_840ba5_idx ON public.stories_story USING btree (project_id, ref);
 2   DROP INDEX public.stories_sto_project_840ba5_idx;
       public            taiga    false    232    232            �           1259    7771093 $   stories_story_created_by_id_052bf6c8    INDEX     g   CREATE INDEX stories_story_created_by_id_052bf6c8 ON public.stories_story USING btree (created_by_id);
 8   DROP INDEX public.stories_story_created_by_id_052bf6c8;
       public            taiga    false    232            �           1259    7771094 !   stories_story_project_id_c78d9ba8    INDEX     a   CREATE INDEX stories_story_project_id_c78d9ba8 ON public.stories_story USING btree (project_id);
 5   DROP INDEX public.stories_story_project_id_c78d9ba8;
       public            taiga    false    232            �           1259    7771049    stories_story_ref_07544f5a    INDEX     S   CREATE INDEX stories_story_ref_07544f5a ON public.stories_story USING btree (ref);
 .   DROP INDEX public.stories_story_ref_07544f5a;
       public            taiga    false    232            �           1259    7771095     stories_story_status_id_15c8b6c9    INDEX     _   CREATE INDEX stories_story_status_id_15c8b6c9 ON public.stories_story USING btree (status_id);
 4   DROP INDEX public.stories_story_status_id_15c8b6c9;
       public            taiga    false    232            �           1259    7771096 "   stories_story_workflow_id_448ab642    INDEX     c   CREATE INDEX stories_story_workflow_id_448ab642 ON public.stories_story USING btree (workflow_id);
 6   DROP INDEX public.stories_story_workflow_id_448ab642;
       public            taiga    false    232            �           1259    7771117    tokens_deny_token_i_25cc28_idx    INDEX     e   CREATE INDEX tokens_deny_token_i_25cc28_idx ON public.tokens_denylistedtoken USING btree (token_id);
 2   DROP INDEX public.tokens_deny_token_i_25cc28_idx;
       public            taiga    false    235            �           1259    7771114    tokens_outs_content_1b2775_idx    INDEX     �   CREATE INDEX tokens_outs_content_1b2775_idx ON public.tokens_outstandingtoken USING btree (content_type_id, object_id, token_type);
 2   DROP INDEX public.tokens_outs_content_1b2775_idx;
       public            taiga    false    234    234    234            �           1259    7771116    tokens_outs_expires_ce645d_idx    INDEX     h   CREATE INDEX tokens_outs_expires_ce645d_idx ON public.tokens_outstandingtoken USING btree (expires_at);
 2   DROP INDEX public.tokens_outs_expires_ce645d_idx;
       public            taiga    false    234            �           1259    7771115    tokens_outs_jti_766f39_idx    INDEX     ]   CREATE INDEX tokens_outs_jti_766f39_idx ON public.tokens_outstandingtoken USING btree (jti);
 .   DROP INDEX public.tokens_outs_jti_766f39_idx;
       public            taiga    false    234            �           1259    7771124 0   tokens_outstandingtoken_content_type_id_06cfd70a    INDEX        CREATE INDEX tokens_outstandingtoken_content_type_id_06cfd70a ON public.tokens_outstandingtoken USING btree (content_type_id);
 D   DROP INDEX public.tokens_outstandingtoken_content_type_id_06cfd70a;
       public            taiga    false    234            �           1259    7771123 )   tokens_outstandingtoken_jti_ac7232c7_like    INDEX     �   CREATE INDEX tokens_outstandingtoken_jti_ac7232c7_like ON public.tokens_outstandingtoken USING btree (jti varchar_pattern_ops);
 =   DROP INDEX public.tokens_outstandingtoken_jti_ac7232c7_like;
       public            taiga    false    234            F           1259    7770715    users_authd_user_id_d24d4c_idx    INDEX     a   CREATE INDEX users_authd_user_id_d24d4c_idx ON public.users_authdata USING btree (user_id, key);
 2   DROP INDEX public.users_authd_user_id_d24d4c_idx;
       public            taiga    false    206    206            G           1259    7770725    users_authdata_key_c3b89eef    INDEX     U   CREATE INDEX users_authdata_key_c3b89eef ON public.users_authdata USING btree (key);
 /   DROP INDEX public.users_authdata_key_c3b89eef;
       public            taiga    false    206            H           1259    7770726     users_authdata_key_c3b89eef_like    INDEX     n   CREATE INDEX users_authdata_key_c3b89eef_like ON public.users_authdata USING btree (key varchar_pattern_ops);
 4   DROP INDEX public.users_authdata_key_c3b89eef_like;
       public            taiga    false    206            M           1259    7770727    users_authdata_user_id_9625853a    INDEX     ]   CREATE INDEX users_authdata_user_id_9625853a ON public.users_authdata USING btree (user_id);
 3   DROP INDEX public.users_authdata_user_id_9625853a;
       public            taiga    false    206            <           1259    7770719    users_user_email_243f6e77_like    INDEX     j   CREATE INDEX users_user_email_243f6e77_like ON public.users_user USING btree (email varchar_pattern_ops);
 2   DROP INDEX public.users_user_email_243f6e77_like;
       public            taiga    false    205            =           1259    7770714    users_user_email_6f2530_idx    INDEX     S   CREATE INDEX users_user_email_6f2530_idx ON public.users_user USING btree (email);
 /   DROP INDEX public.users_user_email_6f2530_idx;
       public            taiga    false    205            B           1259    7770713    users_user_usernam_65d164_idx    INDEX     X   CREATE INDEX users_user_usernam_65d164_idx ON public.users_user USING btree (username);
 1   DROP INDEX public.users_user_usernam_65d164_idx;
       public            taiga    false    205            C           1259    7770718 !   users_user_username_06e46fe6_like    INDEX     p   CREATE INDEX users_user_username_06e46fe6_like ON public.users_user USING btree (username varchar_pattern_ops);
 5   DROP INDEX public.users_user_username_06e46fe6_like;
       public            taiga    false    205            �           1259    7771023    workflows_w_project_5a96f0_idx    INDEX     i   CREATE INDEX workflows_w_project_5a96f0_idx ON public.workflows_workflow USING btree (project_id, slug);
 2   DROP INDEX public.workflows_w_project_5a96f0_idx;
       public            taiga    false    230    230            �           1259    7771022    workflows_w_workflo_b8ac5c_idx    INDEX     p   CREATE INDEX workflows_w_workflo_b8ac5c_idx ON public.workflows_workflowstatus USING btree (workflow_id, slug);
 2   DROP INDEX public.workflows_w_workflo_b8ac5c_idx;
       public            taiga    false    231    231            �           1259    7771033 &   workflows_workflow_project_id_59dd45ec    INDEX     k   CREATE INDEX workflows_workflow_project_id_59dd45ec ON public.workflows_workflow USING btree (project_id);
 :   DROP INDEX public.workflows_workflow_project_id_59dd45ec;
       public            taiga    false    230            �           1259    7771039 -   workflows_workflowstatus_workflow_id_8efaaa04    INDEX     y   CREATE INDEX workflows_workflowstatus_workflow_id_8efaaa04 ON public.workflows_workflowstatus USING btree (workflow_id);
 A   DROP INDEX public.workflows_workflowstatus_workflow_id_8efaaa04;
       public            taiga    false    231            �           1259    7771138    workspaces__workspa_2769b6_idx    INDEX     w   CREATE INDEX workspaces__workspa_2769b6_idx ON public.workspaces_roles_workspacerole USING btree (workspace_id, slug);
 2   DROP INDEX public.workspaces__workspa_2769b6_idx;
       public            taiga    false    236    236            �           1259    7771156    workspaces__workspa_e36c45_idx    INDEX     �   CREATE INDEX workspaces__workspa_e36c45_idx ON public.workspaces_memberships_workspacemembership USING btree (workspace_id, user_id);
 2   DROP INDEX public.workspaces__workspa_e36c45_idx;
       public            taiga    false    237    237            �           1259    7771176 0   workspaces_memberships_wor_workspace_id_fd6f07d4    INDEX     �   CREATE INDEX workspaces_memberships_wor_workspace_id_fd6f07d4 ON public.workspaces_memberships_workspacemembership USING btree (workspace_id);
 D   DROP INDEX public.workspaces_memberships_wor_workspace_id_fd6f07d4;
       public            taiga    false    237            �           1259    7771174 ;   workspaces_memberships_workspacemembership_role_id_4ea4e76e    INDEX     �   CREATE INDEX workspaces_memberships_workspacemembership_role_id_4ea4e76e ON public.workspaces_memberships_workspacemembership USING btree (role_id);
 O   DROP INDEX public.workspaces_memberships_workspacemembership_role_id_4ea4e76e;
       public            taiga    false    237            �           1259    7771175 ;   workspaces_memberships_workspacemembership_user_id_89b29e02    INDEX     �   CREATE INDEX workspaces_memberships_workspacemembership_user_id_89b29e02 ON public.workspaces_memberships_workspacemembership USING btree (user_id);
 O   DROP INDEX public.workspaces_memberships_workspacemembership_user_id_89b29e02;
       public            taiga    false    237            �           1259    7771148 ,   workspaces_roles_workspacerole_slug_6d21c03e    INDEX     w   CREATE INDEX workspaces_roles_workspacerole_slug_6d21c03e ON public.workspaces_roles_workspacerole USING btree (slug);
 @   DROP INDEX public.workspaces_roles_workspacerole_slug_6d21c03e;
       public            taiga    false    236            �           1259    7771149 1   workspaces_roles_workspacerole_slug_6d21c03e_like    INDEX     �   CREATE INDEX workspaces_roles_workspacerole_slug_6d21c03e_like ON public.workspaces_roles_workspacerole USING btree (slug varchar_pattern_ops);
 E   DROP INDEX public.workspaces_roles_workspacerole_slug_6d21c03e_like;
       public            taiga    false    236            �           1259    7771150 4   workspaces_roles_workspacerole_workspace_id_1aebcc14    INDEX     �   CREATE INDEX workspaces_roles_workspacerole_workspace_id_1aebcc14 ON public.workspaces_roles_workspacerole USING btree (workspace_id);
 H   DROP INDEX public.workspaces_roles_workspacerole_workspace_id_1aebcc14;
       public            taiga    false    236            {           1259    7771182 &   workspaces_workspace_owner_id_d8b120c0    INDEX     k   CREATE INDEX workspaces_workspace_owner_id_d8b120c0 ON public.workspaces_workspace USING btree (owner_id);
 :   DROP INDEX public.workspaces_workspace_owner_id_d8b120c0;
       public            taiga    false    223                       2620    7771269 2   procrastinate_jobs procrastinate_jobs_notify_queue    TRIGGER     �   CREATE TRIGGER procrastinate_jobs_notify_queue AFTER INSERT ON public.procrastinate_jobs FOR EACH ROW WHEN ((new.status = 'todo'::public.procrastinate_job_status)) EXECUTE FUNCTION public.procrastinate_notify_queue();
 K   DROP TRIGGER procrastinate_jobs_notify_queue ON public.procrastinate_jobs;
       public          taiga    false    336    239    862    239                        2620    7771273 4   procrastinate_jobs procrastinate_trigger_delete_jobs    TRIGGER     �   CREATE TRIGGER procrastinate_trigger_delete_jobs BEFORE DELETE ON public.procrastinate_jobs FOR EACH ROW EXECUTE FUNCTION public.procrastinate_unlink_periodic_defers();
 M   DROP TRIGGER procrastinate_trigger_delete_jobs ON public.procrastinate_jobs;
       public          taiga    false    352    239                       2620    7771272 9   procrastinate_jobs procrastinate_trigger_scheduled_events    TRIGGER     &  CREATE TRIGGER procrastinate_trigger_scheduled_events AFTER INSERT OR UPDATE ON public.procrastinate_jobs FOR EACH ROW WHEN (((new.scheduled_at IS NOT NULL) AND (new.status = 'todo'::public.procrastinate_job_status))) EXECUTE FUNCTION public.procrastinate_trigger_scheduled_events_procedure();
 R   DROP TRIGGER procrastinate_trigger_scheduled_events ON public.procrastinate_jobs;
       public          taiga    false    239    351    862    239    239                       2620    7771271 =   procrastinate_jobs procrastinate_trigger_status_events_insert    TRIGGER     �   CREATE TRIGGER procrastinate_trigger_status_events_insert AFTER INSERT ON public.procrastinate_jobs FOR EACH ROW WHEN ((new.status = 'todo'::public.procrastinate_job_status)) EXECUTE FUNCTION public.procrastinate_trigger_status_events_procedure_insert();
 V   DROP TRIGGER procrastinate_trigger_status_events_insert ON public.procrastinate_jobs;
       public          taiga    false    239    349    239    862                       2620    7771270 =   procrastinate_jobs procrastinate_trigger_status_events_update    TRIGGER     �   CREATE TRIGGER procrastinate_trigger_status_events_update AFTER UPDATE OF status ON public.procrastinate_jobs FOR EACH ROW EXECUTE FUNCTION public.procrastinate_trigger_status_events_procedure_update();
 V   DROP TRIGGER procrastinate_trigger_status_events_update ON public.procrastinate_jobs;
       public          taiga    false    350    239    239            �           2606    7770799 O   auth_group_permissions auth_group_permissio_permission_id_84c5c92e_fk_auth_perm    FK CONSTRAINT     �   ALTER TABLE ONLY public.auth_group_permissions
    ADD CONSTRAINT auth_group_permissio_permission_id_84c5c92e_fk_auth_perm FOREIGN KEY (permission_id) REFERENCES public.auth_permission(id) DEFERRABLE INITIALLY DEFERRED;
 y   ALTER TABLE ONLY public.auth_group_permissions DROP CONSTRAINT auth_group_permissio_permission_id_84c5c92e_fk_auth_perm;
       public          taiga    false    216    3162    212            �           2606    7770794 P   auth_group_permissions auth_group_permissions_group_id_b120cbf9_fk_auth_group_id    FK CONSTRAINT     �   ALTER TABLE ONLY public.auth_group_permissions
    ADD CONSTRAINT auth_group_permissions_group_id_b120cbf9_fk_auth_group_id FOREIGN KEY (group_id) REFERENCES public.auth_group(id) DEFERRABLE INITIALLY DEFERRED;
 z   ALTER TABLE ONLY public.auth_group_permissions DROP CONSTRAINT auth_group_permissions_group_id_b120cbf9_fk_auth_group_id;
       public          taiga    false    214    216    3167            �           2606    7770785 E   auth_permission auth_permission_content_type_id_2f476e4b_fk_django_co    FK CONSTRAINT     �   ALTER TABLE ONLY public.auth_permission
    ADD CONSTRAINT auth_permission_content_type_id_2f476e4b_fk_django_co FOREIGN KEY (content_type_id) REFERENCES public.django_content_type(id) DEFERRABLE INITIALLY DEFERRED;
 o   ALTER TABLE ONLY public.auth_permission DROP CONSTRAINT auth_permission_content_type_id_2f476e4b_fk_django_co;
       public          taiga    false    212    208    3153            �           2606    7770748 G   django_admin_log django_admin_log_content_type_id_c4bce8eb_fk_django_co    FK CONSTRAINT     �   ALTER TABLE ONLY public.django_admin_log
    ADD CONSTRAINT django_admin_log_content_type_id_c4bce8eb_fk_django_co FOREIGN KEY (content_type_id) REFERENCES public.django_content_type(id) DEFERRABLE INITIALLY DEFERRED;
 q   ALTER TABLE ONLY public.django_admin_log DROP CONSTRAINT django_admin_log_content_type_id_c4bce8eb_fk_django_co;
       public          taiga    false    3153    210    208            �           2606    7770753 C   django_admin_log django_admin_log_user_id_c564eba6_fk_users_user_id    FK CONSTRAINT     �   ALTER TABLE ONLY public.django_admin_log
    ADD CONSTRAINT django_admin_log_user_id_c564eba6_fk_users_user_id FOREIGN KEY (user_id) REFERENCES public.users_user(id) DEFERRABLE INITIALLY DEFERRED;
 m   ALTER TABLE ONLY public.django_admin_log DROP CONSTRAINT django_admin_log_user_id_c564eba6_fk_users_user_id;
       public          taiga    false    205    3137    210            �           2606    7770839 N   easy_thumbnails_thumbnail easy_thumbnails_thum_source_id_5b57bc77_fk_easy_thum    FK CONSTRAINT     �   ALTER TABLE ONLY public.easy_thumbnails_thumbnail
    ADD CONSTRAINT easy_thumbnails_thum_source_id_5b57bc77_fk_easy_thum FOREIGN KEY (source_id) REFERENCES public.easy_thumbnails_source(id) DEFERRABLE INITIALLY DEFERRED;
 x   ALTER TABLE ONLY public.easy_thumbnails_thumbnail DROP CONSTRAINT easy_thumbnails_thum_source_id_5b57bc77_fk_easy_thum;
       public          taiga    false    3177    220    218            �           2606    7770860 [   easy_thumbnails_thumbnaildimensions easy_thumbnails_thum_thumbnail_id_c3a0c549_fk_easy_thum    FK CONSTRAINT     �   ALTER TABLE ONLY public.easy_thumbnails_thumbnaildimensions
    ADD CONSTRAINT easy_thumbnails_thum_thumbnail_id_c3a0c549_fk_easy_thum FOREIGN KEY (thumbnail_id) REFERENCES public.easy_thumbnails_thumbnail(id) DEFERRABLE INITIALLY DEFERRED;
 �   ALTER TABLE ONLY public.easy_thumbnails_thumbnaildimensions DROP CONSTRAINT easy_thumbnails_thum_thumbnail_id_c3a0c549_fk_easy_thum;
       public          taiga    false    220    222    3187                       2606    7771248 5   procrastinate_events procrastinate_events_job_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.procrastinate_events
    ADD CONSTRAINT procrastinate_events_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.procrastinate_jobs(id) ON DELETE CASCADE;
 _   ALTER TABLE ONLY public.procrastinate_events DROP CONSTRAINT procrastinate_events_job_id_fkey;
       public          taiga    false    239    3308    243                       2606    7771234 G   procrastinate_periodic_defers procrastinate_periodic_defers_job_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.procrastinate_periodic_defers
    ADD CONSTRAINT procrastinate_periodic_defers_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.procrastinate_jobs(id);
 q   ALTER TABLE ONLY public.procrastinate_periodic_defers DROP CONSTRAINT procrastinate_periodic_defers_job_id_fkey;
       public          taiga    false    239    3308    241                       2606    7770960 _   projects_invitations_projectinvitation projects_invitations_invited_by_id_e41218dc_fk_users_use    FK CONSTRAINT     �   ALTER TABLE ONLY public.projects_invitations_projectinvitation
    ADD CONSTRAINT projects_invitations_invited_by_id_e41218dc_fk_users_use FOREIGN KEY (invited_by_id) REFERENCES public.users_user(id) DEFERRABLE INITIALLY DEFERRED;
 �   ALTER TABLE ONLY public.projects_invitations_projectinvitation DROP CONSTRAINT projects_invitations_invited_by_id_e41218dc_fk_users_use;
       public          taiga    false    205    3137    228                       2606    7770965 \   projects_invitations_projectinvitation projects_invitations_project_id_8a729cae_fk_projects_    FK CONSTRAINT     �   ALTER TABLE ONLY public.projects_invitations_projectinvitation
    ADD CONSTRAINT projects_invitations_project_id_8a729cae_fk_projects_ FOREIGN KEY (project_id) REFERENCES public.projects_project(id) DEFERRABLE INITIALLY DEFERRED;
 �   ALTER TABLE ONLY public.projects_invitations_projectinvitation DROP CONSTRAINT projects_invitations_project_id_8a729cae_fk_projects_;
       public          taiga    false    224    228    3201                       2606    7770970 ^   projects_invitations_projectinvitation projects_invitations_resent_by_id_68c580e8_fk_users_use    FK CONSTRAINT     �   ALTER TABLE ONLY public.projects_invitations_projectinvitation
    ADD CONSTRAINT projects_invitations_resent_by_id_68c580e8_fk_users_use FOREIGN KEY (resent_by_id) REFERENCES public.users_user(id) DEFERRABLE INITIALLY DEFERRED;
 �   ALTER TABLE ONLY public.projects_invitations_projectinvitation DROP CONSTRAINT projects_invitations_resent_by_id_68c580e8_fk_users_use;
       public          taiga    false    228    3137    205            	           2606    7770975 _   projects_invitations_projectinvitation projects_invitations_revoked_by_id_8a8e629a_fk_users_use    FK CONSTRAINT     �   ALTER TABLE ONLY public.projects_invitations_projectinvitation
    ADD CONSTRAINT projects_invitations_revoked_by_id_8a8e629a_fk_users_use FOREIGN KEY (revoked_by_id) REFERENCES public.users_user(id) DEFERRABLE INITIALLY DEFERRED;
 �   ALTER TABLE ONLY public.projects_invitations_projectinvitation DROP CONSTRAINT projects_invitations_revoked_by_id_8a8e629a_fk_users_use;
       public          taiga    false    228    3137    205            
           2606    7770980 Y   projects_invitations_projectinvitation projects_invitations_role_id_bb735b0e_fk_projects_    FK CONSTRAINT     �   ALTER TABLE ONLY public.projects_invitations_projectinvitation
    ADD CONSTRAINT projects_invitations_role_id_bb735b0e_fk_projects_ FOREIGN KEY (role_id) REFERENCES public.projects_roles_projectrole(id) DEFERRABLE INITIALLY DEFERRED;
 �   ALTER TABLE ONLY public.projects_invitations_projectinvitation DROP CONSTRAINT projects_invitations_role_id_bb735b0e_fk_projects_;
       public          taiga    false    228    3211    226                       2606    7770985 Y   projects_invitations_projectinvitation projects_invitations_user_id_995e9b1c_fk_users_use    FK CONSTRAINT     �   ALTER TABLE ONLY public.projects_invitations_projectinvitation
    ADD CONSTRAINT projects_invitations_user_id_995e9b1c_fk_users_use FOREIGN KEY (user_id) REFERENCES public.users_user(id) DEFERRABLE INITIALLY DEFERRED;
 �   ALTER TABLE ONLY public.projects_invitations_projectinvitation DROP CONSTRAINT projects_invitations_user_id_995e9b1c_fk_users_use;
       public          taiga    false    205    228    3137                       2606    7770919 \   projects_memberships_projectmembership projects_memberships_project_id_7592284f_fk_projects_    FK CONSTRAINT     �   ALTER TABLE ONLY public.projects_memberships_projectmembership
    ADD CONSTRAINT projects_memberships_project_id_7592284f_fk_projects_ FOREIGN KEY (project_id) REFERENCES public.projects_project(id) DEFERRABLE INITIALLY DEFERRED;
 �   ALTER TABLE ONLY public.projects_memberships_projectmembership DROP CONSTRAINT projects_memberships_project_id_7592284f_fk_projects_;
       public          taiga    false    224    3201    227                       2606    7770924 Y   projects_memberships_projectmembership projects_memberships_role_id_43773f6c_fk_projects_    FK CONSTRAINT     �   ALTER TABLE ONLY public.projects_memberships_projectmembership
    ADD CONSTRAINT projects_memberships_role_id_43773f6c_fk_projects_ FOREIGN KEY (role_id) REFERENCES public.projects_roles_projectrole(id) DEFERRABLE INITIALLY DEFERRED;
 �   ALTER TABLE ONLY public.projects_memberships_projectmembership DROP CONSTRAINT projects_memberships_role_id_43773f6c_fk_projects_;
       public          taiga    false    3211    227    226                       2606    7770929 Y   projects_memberships_projectmembership projects_memberships_user_id_8a613b51_fk_users_use    FK CONSTRAINT     �   ALTER TABLE ONLY public.projects_memberships_projectmembership
    ADD CONSTRAINT projects_memberships_user_id_8a613b51_fk_users_use FOREIGN KEY (user_id) REFERENCES public.users_user(id) DEFERRABLE INITIALLY DEFERRED;
 �   ALTER TABLE ONLY public.projects_memberships_projectmembership DROP CONSTRAINT projects_memberships_user_id_8a613b51_fk_users_use;
       public          taiga    false    227    3137    205                        2606    7770937 D   projects_project projects_project_owner_id_b940de39_fk_users_user_id    FK CONSTRAINT     �   ALTER TABLE ONLY public.projects_project
    ADD CONSTRAINT projects_project_owner_id_b940de39_fk_users_user_id FOREIGN KEY (owner_id) REFERENCES public.users_user(id) DEFERRABLE INITIALLY DEFERRED;
 n   ALTER TABLE ONLY public.projects_project DROP CONSTRAINT projects_project_owner_id_b940de39_fk_users_user_id;
       public          taiga    false    205    224    3137                       2606    7770943 D   projects_project projects_project_workspace_id_7ea54f67_fk_workspace    FK CONSTRAINT     �   ALTER TABLE ONLY public.projects_project
    ADD CONSTRAINT projects_project_workspace_id_7ea54f67_fk_workspace FOREIGN KEY (workspace_id) REFERENCES public.workspaces_workspace(id) DEFERRABLE INITIALLY DEFERRED;
 n   ALTER TABLE ONLY public.projects_project DROP CONSTRAINT projects_project_workspace_id_7ea54f67_fk_workspace;
       public          taiga    false    224    223    3197                       2606    7770903 P   projects_roles_projectrole projects_roles_proje_project_id_4efc0342_fk_projects_    FK CONSTRAINT     �   ALTER TABLE ONLY public.projects_roles_projectrole
    ADD CONSTRAINT projects_roles_proje_project_id_4efc0342_fk_projects_ FOREIGN KEY (project_id) REFERENCES public.projects_project(id) DEFERRABLE INITIALLY DEFERRED;
 z   ALTER TABLE ONLY public.projects_roles_projectrole DROP CONSTRAINT projects_roles_proje_project_id_4efc0342_fk_projects_;
       public          taiga    false    224    3201    226                       2606    7771058 I   stories_assignees stories_assignees_story_id_61d41f62_fk_stories_story_id    FK CONSTRAINT     �   ALTER TABLE ONLY public.stories_assignees
    ADD CONSTRAINT stories_assignees_story_id_61d41f62_fk_stories_story_id FOREIGN KEY (story_id) REFERENCES public.stories_story(id) DEFERRABLE INITIALLY DEFERRED;
 s   ALTER TABLE ONLY public.stories_assignees DROP CONSTRAINT stories_assignees_story_id_61d41f62_fk_stories_story_id;
       public          taiga    false    3261    232    233                       2606    7771063 E   stories_assignees stories_assignees_user_id_69fe3c4b_fk_users_user_id    FK CONSTRAINT     �   ALTER TABLE ONLY public.stories_assignees
    ADD CONSTRAINT stories_assignees_user_id_69fe3c4b_fk_users_user_id FOREIGN KEY (user_id) REFERENCES public.users_user(id) DEFERRABLE INITIALLY DEFERRED;
 o   ALTER TABLE ONLY public.stories_assignees DROP CONSTRAINT stories_assignees_user_id_69fe3c4b_fk_users_user_id;
       public          taiga    false    3137    233    205                       2606    7771070 C   stories_story stories_story_created_by_id_052bf6c8_fk_users_user_id    FK CONSTRAINT     �   ALTER TABLE ONLY public.stories_story
    ADD CONSTRAINT stories_story_created_by_id_052bf6c8_fk_users_user_id FOREIGN KEY (created_by_id) REFERENCES public.users_user(id) DEFERRABLE INITIALLY DEFERRED;
 m   ALTER TABLE ONLY public.stories_story DROP CONSTRAINT stories_story_created_by_id_052bf6c8_fk_users_user_id;
       public          taiga    false    205    232    3137                       2606    7771075 F   stories_story stories_story_project_id_c78d9ba8_fk_projects_project_id    FK CONSTRAINT     �   ALTER TABLE ONLY public.stories_story
    ADD CONSTRAINT stories_story_project_id_c78d9ba8_fk_projects_project_id FOREIGN KEY (project_id) REFERENCES public.projects_project(id) DEFERRABLE INITIALLY DEFERRED;
 p   ALTER TABLE ONLY public.stories_story DROP CONSTRAINT stories_story_project_id_c78d9ba8_fk_projects_project_id;
       public          taiga    false    3201    232    224                       2606    7771080 M   stories_story stories_story_status_id_15c8b6c9_fk_workflows_workflowstatus_id    FK CONSTRAINT     �   ALTER TABLE ONLY public.stories_story
    ADD CONSTRAINT stories_story_status_id_15c8b6c9_fk_workflows_workflowstatus_id FOREIGN KEY (status_id) REFERENCES public.workflows_workflowstatus(id) DEFERRABLE INITIALLY DEFERRED;
 w   ALTER TABLE ONLY public.stories_story DROP CONSTRAINT stories_story_status_id_15c8b6c9_fk_workflows_workflowstatus_id;
       public          taiga    false    3254    232    231                       2606    7771085 I   stories_story stories_story_workflow_id_448ab642_fk_workflows_workflow_id    FK CONSTRAINT     �   ALTER TABLE ONLY public.stories_story
    ADD CONSTRAINT stories_story_workflow_id_448ab642_fk_workflows_workflow_id FOREIGN KEY (workflow_id) REFERENCES public.workflows_workflow(id) DEFERRABLE INITIALLY DEFERRED;
 s   ALTER TABLE ONLY public.stories_story DROP CONSTRAINT stories_story_workflow_id_448ab642_fk_workflows_workflow_id;
       public          taiga    false    3246    230    232                       2606    7771125 J   tokens_denylistedtoken tokens_denylistedtok_token_id_43d24f6f_fk_tokens_ou    FK CONSTRAINT     �   ALTER TABLE ONLY public.tokens_denylistedtoken
    ADD CONSTRAINT tokens_denylistedtok_token_id_43d24f6f_fk_tokens_ou FOREIGN KEY (token_id) REFERENCES public.tokens_outstandingtoken(id) DEFERRABLE INITIALLY DEFERRED;
 t   ALTER TABLE ONLY public.tokens_denylistedtoken DROP CONSTRAINT tokens_denylistedtok_token_id_43d24f6f_fk_tokens_ou;
       public          taiga    false    235    234    3281                       2606    7771118 R   tokens_outstandingtoken tokens_outstandingto_content_type_id_06cfd70a_fk_django_co    FK CONSTRAINT     �   ALTER TABLE ONLY public.tokens_outstandingtoken
    ADD CONSTRAINT tokens_outstandingto_content_type_id_06cfd70a_fk_django_co FOREIGN KEY (content_type_id) REFERENCES public.django_content_type(id) DEFERRABLE INITIALLY DEFERRED;
 |   ALTER TABLE ONLY public.tokens_outstandingtoken DROP CONSTRAINT tokens_outstandingto_content_type_id_06cfd70a_fk_django_co;
       public          taiga    false    208    234    3153            �           2606    7770720 ?   users_authdata users_authdata_user_id_9625853a_fk_users_user_id    FK CONSTRAINT     �   ALTER TABLE ONLY public.users_authdata
    ADD CONSTRAINT users_authdata_user_id_9625853a_fk_users_user_id FOREIGN KEY (user_id) REFERENCES public.users_user(id) DEFERRABLE INITIALLY DEFERRED;
 i   ALTER TABLE ONLY public.users_authdata DROP CONSTRAINT users_authdata_user_id_9625853a_fk_users_user_id;
       public          taiga    false    205    206    3137                       2606    7771028 P   workflows_workflow workflows_workflow_project_id_59dd45ec_fk_projects_project_id    FK CONSTRAINT     �   ALTER TABLE ONLY public.workflows_workflow
    ADD CONSTRAINT workflows_workflow_project_id_59dd45ec_fk_projects_project_id FOREIGN KEY (project_id) REFERENCES public.projects_project(id) DEFERRABLE INITIALLY DEFERRED;
 z   ALTER TABLE ONLY public.workflows_workflow DROP CONSTRAINT workflows_workflow_project_id_59dd45ec_fk_projects_project_id;
       public          taiga    false    224    230    3201                       2606    7771034 O   workflows_workflowstatus workflows_workflowst_workflow_id_8efaaa04_fk_workflows    FK CONSTRAINT     �   ALTER TABLE ONLY public.workflows_workflowstatus
    ADD CONSTRAINT workflows_workflowst_workflow_id_8efaaa04_fk_workflows FOREIGN KEY (workflow_id) REFERENCES public.workflows_workflow(id) DEFERRABLE INITIALLY DEFERRED;
 y   ALTER TABLE ONLY public.workflows_workflowstatus DROP CONSTRAINT workflows_workflowst_workflow_id_8efaaa04_fk_workflows;
       public          taiga    false    231    230    3246                       2606    7771159 ]   workspaces_memberships_workspacemembership workspaces_membershi_role_id_4ea4e76e_fk_workspace    FK CONSTRAINT     �   ALTER TABLE ONLY public.workspaces_memberships_workspacemembership
    ADD CONSTRAINT workspaces_membershi_role_id_4ea4e76e_fk_workspace FOREIGN KEY (role_id) REFERENCES public.workspaces_roles_workspacerole(id) DEFERRABLE INITIALLY DEFERRED;
 �   ALTER TABLE ONLY public.workspaces_memberships_workspacemembership DROP CONSTRAINT workspaces_membershi_role_id_4ea4e76e_fk_workspace;
       public          taiga    false    236    3289    237                       2606    7771164 ]   workspaces_memberships_workspacemembership workspaces_membershi_user_id_89b29e02_fk_users_use    FK CONSTRAINT     �   ALTER TABLE ONLY public.workspaces_memberships_workspacemembership
    ADD CONSTRAINT workspaces_membershi_user_id_89b29e02_fk_users_use FOREIGN KEY (user_id) REFERENCES public.users_user(id) DEFERRABLE INITIALLY DEFERRED;
 �   ALTER TABLE ONLY public.workspaces_memberships_workspacemembership DROP CONSTRAINT workspaces_membershi_user_id_89b29e02_fk_users_use;
       public          taiga    false    3137    205    237                       2606    7771169 b   workspaces_memberships_workspacemembership workspaces_membershi_workspace_id_fd6f07d4_fk_workspace    FK CONSTRAINT     �   ALTER TABLE ONLY public.workspaces_memberships_workspacemembership
    ADD CONSTRAINT workspaces_membershi_workspace_id_fd6f07d4_fk_workspace FOREIGN KEY (workspace_id) REFERENCES public.workspaces_workspace(id) DEFERRABLE INITIALLY DEFERRED;
 �   ALTER TABLE ONLY public.workspaces_memberships_workspacemembership DROP CONSTRAINT workspaces_membershi_workspace_id_fd6f07d4_fk_workspace;
       public          taiga    false    3197    237    223                       2606    7771143 V   workspaces_roles_workspacerole workspaces_roles_wor_workspace_id_1aebcc14_fk_workspace    FK CONSTRAINT     �   ALTER TABLE ONLY public.workspaces_roles_workspacerole
    ADD CONSTRAINT workspaces_roles_wor_workspace_id_1aebcc14_fk_workspace FOREIGN KEY (workspace_id) REFERENCES public.workspaces_workspace(id) DEFERRABLE INITIALLY DEFERRED;
 �   ALTER TABLE ONLY public.workspaces_roles_workspacerole DROP CONSTRAINT workspaces_roles_wor_workspace_id_1aebcc14_fk_workspace;
       public          taiga    false    223    3197    236            �           2606    7771177 L   workspaces_workspace workspaces_workspace_owner_id_d8b120c0_fk_users_user_id    FK CONSTRAINT     �   ALTER TABLE ONLY public.workspaces_workspace
    ADD CONSTRAINT workspaces_workspace_owner_id_d8b120c0_fk_users_user_id FOREIGN KEY (owner_id) REFERENCES public.users_user(id) DEFERRABLE INITIALLY DEFERRED;
 v   ALTER TABLE ONLY public.workspaces_workspace DROP CONSTRAINT workspaces_workspace_owner_id_d8b120c0_fk_users_user_id;
       public          taiga    false    223    3137    205            �      xڋ���� � �      �      xڋ���� � �      �   �  x�m��r�0E��W��.5�u~#U)<(c���]���Ԣ�%�8���BQ��0�8�e�f���~�ľ����x}曉Y����᣹��~���?'���C���i�Ǵm�2�|qA6T�� Kؖ�2L	ۡ(#�&����.��(���Y����E�:�hT	�����ip_n���[�E�,�kw)UEE(2H�ԇ���d�Z�sjH���f�߰vnp%UGՐ��b`0}A)��҉��赙U4N��Qj���]� {� ��n�_�o��7�؊�eߋq��h��q}\J��&Vhc�( ��i�;k��-_^v��<N�ˇ�E��ɺ[�%{�s1�&�L�P&M�Q��\�4�4���>m֌��]9\���L�%96]�Krd�2)W+���}-�����6{q}�Y��c t ,�AƂ7�DF:W©ԲX���*�z,�Jgu�D��Ce����>Te
����L��y��u{��Bi�oɪɷ��}@�o����rmy�w�a�����\�P�3��f{��7:pl�	�ρ#sN(�mL[�<�������˲�2�,�}1Xg�Y��`�a1�Cm�̿�5m�^ʺ�5
4o�}�I�.�\���V��4Nv�ǇZ5�o�F�Z�$�B�e��^4\��x�v��:iJ���M�(5M�)O�4���0oJ�]ڔGiS�پ���|	՝{�q-�K���lj�T�NH�{yR�-+p�6�2�+���}mB�Lүʶʩ�LdbuΛ�"�k�$ĺ�9Q�e?rk�Mw���� �Ӵg�Y:0�(혎�������Ű��o�1B+�	��ӉKP?��'QaU�8�`�n�k�O)������H"��b��Tp�2^
�&��z���t�M�ٳyb h�McA��d��	W���8=�|�k���xK�UV=J�-��l��q5��&S2��$�����?H7      �      xڋ���� � �      �     x�uQYn� �fS�lw�3uh�"fh��;^�����m���y�H5%t滈��%�����t)����Y/�Е?� A8�hp�0Ѵ�i&�F���������7�w���1���yr'�!=(궴]!HY����)HU'�[�r���m"Ƚ�)|c˴ �͛��b���~X������>n��?�5Oc��Myڒu�Y����_}xҊ@^�P�l9�� ɖr�w %��{uk���@MÕ��ݼ�}	�������Y!���XW^v�?|~ �/����      �   �  xڕ��r�0���S��F��o��3Pc[�,����ebH�`��Χ��g%Z�z��B�o}򶮀 >�@�"Q<�%��?	�@�mrmJ�έQj��J������"C��]%`�p��Ƴ��	���S
���������+#��%Z�\ۃ����zfY��G|)>�\~0�/����GI�tA�*�?.7#w��`l�\4��������D��wS����5�BT�
JO(����X_/R�bRJ&���O��|G�k�J((���Q�>��S=�B
Z(0QDȟ���Dʨ�еy�$(�rp�ȋ�W[��M!�%0.�M�����
J�M85۝�>+%p��O$��G�P�)]���%�!�S�
è�X�K��RjN]n�3]��H����BƔg
�U=���,�[t鵮�O˻�8AV
 R9۟M:���6�~�M�A�q @��p����k�og\� �[�/}gwk�RΙ֣����n�V�D�-:g���P�9SuY2�Wq㚧�p}�!9�r����oG��O2�+S�r>�T��׷�>�T&��WS`t<YW���yY�j�2�2��:�-�Ė�P��|�x�F�	��#��l�к5z���R���T��5��EŪ^\��(�9�%��o�.�b˄@6:�������s3z��������h]^�_��f��a|�      �      xڋ���� � �      �   ~  xڕ�ݪ+����~�܇�GR�u�%7�@�����+��Y��1<SH������X[����r�*c5�3������Ǟ�����u��kَ�=����B���ٻ8#i�T�e�똳�A�?���!i�A����)��#��J�S��h@M]|e�r�nU�Kr��Y���C��l>mJ�E~�y�v佢`�η��}I��I��kK,]�>}�a{�o��ؘ��i��k��{s��g��$i��[�>�ҹU:\gt��t��;&j�}���+��u\�x�8������AR�[�=)��I��[�ymZR��c�S�ԉ���9+���c��Ψ�)j뽢ά���_RAκ��Ђ����0�PZ��~zjղٓE���<*ҧ+�I�B~K��K:�JtYs��־���F�p}6x&t.Y�(a38~ѡ9�Xԇ�uOm��Կ/���B@�p��cW�Ѱ�[���h[zh�Ć9�ڇ���[��?Hʠ�[R~_�BЀ0���&<�i�5��<s�k��eY�̖Q�ݘ��.9�%%h��*1}_S�fn^�v�yh��&TEu�ӎd۰=��u�S{����E=^����U�W#	^�=�Э����&kl����`&��ھ���n��$=��B�n��uн�tƌq��M0�(C���+��&@���޶�������'���	P�Dz�o@���et]������Z����zk�^�� G�]V�P��'/�q�m��p����V��>�S����$����[�MlO4M@|^�җ�.`y?�"�X&�5[�hܐ^��Qk�5�&�l4%e���?��N|ucS����(��T�p����rwC���b�j���&�$�����n�PV����D����y�,A���a#~b�W�mV����N�		n Wv�í��KjTG�8̄�IW��sxoQ��4� ���N�d�/h��9����\g�9�<����p�� �R���jb��ږV4!���$�(~^u��*	Ou�X��i��H��>��ʺפ��H����f��[�/�H{i�'iWP�W���q�ȝ��ЙL b�0���(�N��e��T$��	����py���c�Km�4�ORr9��ܺY�aa�ipmIlTr���&��`�,H9���ۺ��1�K�(\-D����y�<�m�i�ݩ�/����'}�<�O����{#tA{܌��M�Rn�P(9�OQ��I��$�X ��N��m\��R)1{ ��!��3���
�# �4��7���s'ȍxc�9�:Rc���d0jU��ӍAp�#~��M.󃤎i��S<=ą�'��
0#k�N!t���0�̄�8n��O���`��=��N������>n      �     x�ř͊$��ϓO���N���}��!4�E�}|YVu�9��04�t�E��Y4����mY��|�Z���QY+�?~���f����<ǩ'��f�:�yf咊H�l���r��Y���Zﵱ6:���?�T�T����~����������/Ŀ����WJ�J�ʉ���D?��'8��t����$oN����XO>��6�թ�f=RZ���E�ɔ�{��6(��Y�.�ҳ���Þ༩ga7�7g�ϩ�����Y��a�X��ł�,YW��Zw�=�n*�]3���%��S�R�8��Op��3��7g�9�u&��⺚��,\�,�]��i��#F�ce+Ľ�;x��yY��3�_�v��w��,Yߜ�s���'����gҐZ���T�[Ǘ�k�xZj�m�ԝ�J:��t"�����	Л�:,$>�|�r\g�
�"| �'�H����ZGx~�,>���Գ��)���zC����]E�,�tc'���Mt&o}攧�p+0��ܱBaB���Q|�?hQoMR�{3�ɓ�-��w-������,�4�d���!�ZZSK�J3E.� W,�\碌�R�5^\|OQg�@����ME�H#�n�%f.�I�6���k�b��c4��k���2�R�sb��l��R4`O�.�8؟ ���
V�7��f�����,/�˒�����J��2L���$t���
�dk�4����;��!��]I3�|H�v����$�G�eK+&�e�h%IF�L�,O�	�Y�y"bP���ٿIQ��	�[��/Ē��^��i��\�e���A���֢�(u�����G���BSGe)5ׂo���(_��E*���w%�wԻH7�S��
s�����b�6�K��.ͱG�z�##�u��'Xl����s`f_�zH~�������|H7���j�8��g9x�,�4�"ֲ���f�c����S'd�=M�~���v�?AzW�\����ЎR�O��ClVԌ�*FEHY:ܪ�NLS�x5Fiu���-��I����t(=AzW�0��%)�D����'#*�\YX�[NM�"x�BSƇ�(?#����لmɖ��Ș_�����MM㚧�H7VT�E9xkV�nk��j\�� Y*CВ+*��9���\��llL{��Y�U�'H�jjY�|H�N>�
��tZ�Z�: M�%+â���Z<�Xb���db{��Y�{=�C��w5ņ��!-;�4�H��8�4���Zn�U�R��aS����S��i�j�k?�'H�j	/�t�E���׺F��ε.!�Ɋj듋¤P�k��ڱ��Ȃ��a�ش�;Q�|]��}MN����$�Qv���N��`�����WS[��Vi���ү�D|�cɊ��\�h�dE�$͔�w��w5uQ��t��Z�CM�c��Vd�Wb���*(�Ԑ_zB��R&ޏ9�p�[�2i�o%D�'Hoj�J����tcE�!�e��+]~^���f"�`�������D��+�����>�ظ6����_�T����M/Ң��CZv�#��΀=�Z�����f�����hYp�X-ӣ�L
F;����iXQ�ӷ��	қ�¬)�i��E;#D�s�Qe����R�K�[E���r�Bi�)SG�-ME�P�Hӑ�	һ�b��~H7vTB<Q�;Q����^��̵����xj��rufF1A�����,}O�C}�~>�<AzW�М҇Tw_Vδ
�_}�#O#��?���rC���������)� +U�cꞟ*J��O�ɞ ����h�o�|��X���      �      xڋ���� � �      �   �  xڅ�A��E��UdtAI��k�$h;pw�?���G.��G�DI������������k���cȿ�}q�n��x�{�o�/�����������#9�')��*
T#��?�����+�tZ����L�)AZ�}*��4pȶ�2ȓ�A��J�i@��ρ��r��Vs@�w
�Ps�9�4���R&N�/�0�,`;�k�B5��aa<kF�Z����5�������:�Yc�/��f]L+�� �� t͵rz']��X�bg�6��mB"aFp�`�kz���y�z�F��������ҮT����Xl����5�5;������4¢�n�fJ�OvLEvH���&�Ϲ`N�Oގ���\4�٠[y���f�Y�si�d��REa�;�y�cї���v��+x'�h�{b�KPPA�5�I�i�i��="3�VC�B��J�uMf�3>,��H��`�:ۅ���%��X�n�A˴�.b�j`������_ӌ
v��׍�)�#�g�$��m, O�:w|��k�=� ������a����d�4��m�0�{.�;PW����G�m%t�:���X4v]�t�Y,\�j)��l���oxn�EפN�n5l��?k�����kΗ`�=�B2�q��F��j��dW�m�����&w��^�f5��?k��9gn��Kp��2�PA}��jN�QZ4mt���:�������Ɏ~[7u	�6�7�d5�>y�:�b(�j����cjγY���z�&�>K<��e(�ut��⯗���,�K�S��`���Q>�-����w�mIK��L�OG���I3�#8"^?KL�>/[��ţ����3�1��g��}Gt�A�{F�G�}2.�u�tq�@IQ?'Y�=~���
�d�(	g�x�w���5���F�[d�����50Ĭ�F	�������p�a{�]���m5p��<Vj(��o��dt'�ۨ:��pk��>_PŮ��~�o�z�	�Yd!��Y0����=p;�'�X�h'W�ExkB�>�H<�>{:̓��]/e�=��5L��i��6(m<��_��=X"x[�~��>�'��:p��}p	��ͷ�������^���?�>��<�	t�o��d�%]�}�h�qF��~6lx��o^#��8^���$\	�k�2p�5�aEϠM���C�2I�\����Kfo���kН����� � 2_D6�m'�.����,8!��8ҥi��=Ѩ��D���'���8p<��C�J��&ʺ��8oD޲�Λ�p.H�bE��z�7z�4-6`��=ښpc�稯5x^�ؑi)ݶ�sjQ���S�=��>ў����]��~�E�^��{R���|��b׈�����	K[��7�E���x�Af�T����B�NDof�t̴�F�=N�]:^��ْ���z�)'{Gv+_��� u�E���K��6�c�z�l�g�F��������K���q.H��ь8�p��qe��z�]�H-�6�q-�C�K�D�Y}�����ڊ���M��"�ʳ(�g�X��?qf��q#u馅Rjg�o��E'\�~6�&��&ܘ G�O�^���M���ܽ�ݙ��z���d[ǌ�$j��Z���6���"A�^���;�PI�6��3��.z>��q��&�jNL���Y߆Z�N��O�_���M ˱�d�o���}�����$      �      x��m��ȶ�_��)*����G���� &q"D,Ey8q��Mj�̩��α��\<�'���[Ъ&��Z��\����wM��^z�����[�]�˷K�vo����`���*����O����� ���q�x;盟�����O����I��'o��<+������O��c�+�<�ydo�֋h���/T�QY�53D���䴵���7z��t���`;IU��bמ㊫�ݸ[5^Mi0��9؀
bK�L����m�a�j�,r�4�K��ι�!�� AT�ʕP��q�ū�@f˥I��4ō Vy�ȅ��R�2p�deF	��B3#��4�C�Fj�|�66���2'��f�d}�!���˚���pq��M��?��z����#A{i.q�������o����!8�#������]/������qH�a�����;�s��.>����)�r*�r��>i�
	����18��c/�,����e�޼sд���Q�������������k���ۻ����wy��k־-�nq�G���7���0eO��=��9�k����JzE�o��(Y<����$��p��u���A` 1r(j&L�4f�*���!�����F'����,ӯAc�%$� �,u����	Y�	�\YDF�A"��� 3l.�J�����.MǇ�Rxcdz��XVA|�סQN���7&^��^�욦���9���=�^DR���������=�ܗ͂r�b�����)~�+O��?/든���5�!'�@�@ L�yS�F(R�%��Ţ�gh����a4�1عs�(z��R�ܯ��Qx�s�&�ץix�(f����.�,ð_WФI�~^�Mx��Є��x/���?H=�����f&��SD�,h!>��)3�����VHC+��MHö/�{���R��$�?C�);,�BZ������������ϯ���8U�J�qu�{�ҵ��@
~R�ˌ��{C�<�
���&��g
�tt(���.Pd�5�TE�&��%Y�����&U�3>��1>�����W�֞�y͎\�J_F��˒�J�{úՑ�
?\=�����C���z�%t�:z%�ƍ+6.��(�4}�#;#�ݯd�V,0������������$p�+��b�˛s�z[��r;Y�l�.�[x����S=�?<r}Q�d��iL�#��L����6���Ь�[�����:V�r��AhƏ���_��j�{����������C�]Gh�q0������������o�Lszq�u\/�~|+ƺT�]��YC��Y�!�(�_ω>�7���sp	��ɻ\���U'-z�+���7��!��g��hK5�4�E�Nac$��L��,��� Ig���{D@�Қ�W�oD�_�0����w�e�27"�k�cO��L�[a��R2�b����bC���/��Go�#-���+����
M�����������u��S�%5j�
JF�0���)JL�Y�8.�{h�O4�OZ�rڄa�NЯ٬�{7YH�i��&��%��M����)&f�8�K�E���E
w����g�.�LtHh�S��A5�ؑfʼf���-�,e5F�λ
�INf�O�\��qӇ��`�?�}�(���`����`��� �W��&
q9�h& c�7;�ͧ�	 &-��s�
C�r��
5c9p�"�=��V�Z��@�Z�e4�=��e&�F���7�X�eh7:��&q�o-=�g�~���RՎe��ĳ;L���`�<���r�R(5	1�V4E �5rf���P�D ������,<��.����[�Z;�#��E�y��뾉����L��)*������iF9�./ ϳ'RM�C�$�H�Z�0PA��CD�$��KM�9H�_���E�r>�q�N�X�����p�lw�ݕ�0�s�2����0�t'�e8���:�|� �K��:{�ӫ��)�^�L��痮�����m���1-�i)ި�A�f�?M�G�hw�M ����t�9(���t�W�^UY,�{�j=�˥~<R��.����[e�)��
��3��/��K{EL��8���^�[p�*�|w!�;b� ��r�Ơ��/ i\#Z�&d5PfǍ���ډ+Q��(�X/���sO�/�9�����f�v���"i����Ͳ]�/f���>	�B�R]�곬H�V�D�"u�N5bH�v���X VE!nh!šF�,%�TT���a�� ���hkqs	��6U�Ǥ|�BHM�Gh=	�b@2Ϊ�XK֟,h���P;�.�4�Z�s0F������'	lmu`�]eMJ���f�秸gq�'�^�kv��pVOln���;��`����Z�e�����,��'� >p
��Ng]E�i�� Π��B���.��Y�.��8�Q���gp>q��$i��i���[�O���ӕMm���MF�΋��p�����Y��`?{��_��ԣI@~�������E�n��~~й�r�)`@���Jh&����Ҳj,��Ă�^�ƈܻ�@;���PR��D���܆��l)̅����آ��։�9�*�����
��E|I����/�:�a�ˍ�ۤ�/l;A�^��C2�U�εа��+�tc��>����*�*2�a�
�6�ò,��f�\��E�|>'�����!�N�?�0���S�T~�;aA4���֮���č\�[S�W�&�I	�C����L�f9�N��u��zWI�{S���:����B.���\�߉Q���� ����w���ޥ����%#-�7��n
$�&�4����rC���ch���]^��"��d�w��lW�S�c�[D�6q{��*������0�'7/}@KDe����jZ���T�v*4��\����K46'����K��ږ*����l�^���/�.֙]�4��y�c;r/�#wh����%�a/�F�¥u��X<勁M" Ӫ�c5�S�h��wk "3�kS���Z�����?�oU��T)E�@�����Q��b2� ,ʎ֒8���CD�/�߃��5Z�Pѣ��X�N����(���L]�n���L@�z�α��n/�W��&�d���u��m�{c����]��*�
L�#��ɓ����_j!�����ǈF�7��C�wG-Q`�*MJ*[���m��������:2�|㔡&���&+g���0����1ӕ�:S�1}�|&9#rq��S�ڰ>!�9#�tH��u�/BZ[��g`� �q0�6:��2��\EP��)���um���h�����b��.��y�K��7#�өJ¤�w��D&b�Җ���5��|���gX#�~<�Ώ���O�]��O�6���BR��z?��/���3�+�<��b���V���K�{w��H֔E�:F�M87B���9J&q����tr�Sp�{�N�s��|4�n��2�փ�~���(��
0ՒM�Y�1}�7�.�wGl�!��#�$7 �+� ��!e���k�L"`����(z�I�ġƎ(�s��"Wy�L��i����q������3��U����?	��.�K]����>���vj�QE ����;F&�⥈��]Ӣվ�h����f�<�����h#��M��K�DJqҙ����'���p`�%�Va�����Y�T��jۘ��qV	�P@M���C�f�b�R� 'WԬ�bx٤�����Tv`��=ۘJ|�j���$bow6��+�ڣN8n�4����ｒ�f�k�Ph��:-9��M��ғ�&a?i���&�'?>s�;���َ����=Y2�Aq������2�d��^>���$p|w{�:$�	��t�R��5hc�#�td��Jc�ӄ��f�Y�A9MSD�c�x:��������]�P.�0���Q^�
:�r[���*�$&�l7��W}o���g?C�~�݅�*0��W�Qiա7�󭹼]�F�A#/�?m�DZ��8��p��D{_3��v�AEkN��IY����p��Wmq��^:���܏�U��s��4���#Հ����^sӘ+��1�4G �  �����3L12'����ς�$��_�զj�O��6;�&E�v �{�(��m�����I<�4�<������̔���dU.�w-�M���3�ѹ���ay��r�<���C��lkRToc��(�dl�&���j��R,�wQ!�ɍF� �i[/��!�́����v
�C�PJz��ܠ&���L��5;�I�"�d�J(k�����U��ah�x߿J�f�N�/�d�ؑѨ����W����ЙVi7�5����μ��4�ZjM�MB�����De]l�]�_�Ag��]�������3�s?oSy��ױ�kg&0���?v�"�w��CD�/�ރ���O��Y)�hfj�-����:n$@c"�i��ѧ`"Ε����S��Z�@ڮPP�'�̉|���_� �O}^PW�쓮�td4*J[N�2�A*��?wM��$ĢfL�1�QY��`���	�7�F��~�(]�z�QR\2<�,x��#��3��뚹�k���U�$�z�vviw]�:��	��}�9��CSGl�Pj�҄�D=��m�\�%P��ާ`�����	��� S2C���$�ۑY��S�NiYY�A�gm�UXF坉.&ӎ�?Mީ�	�!�ӼJ�
 ���.VkM�iy)��i�9���������^Ŏn6��7�Ӽ)�v[73X�ƹ�4�d�ō��Us۟�|���'\���y�pԓ�xA �k���ۮ	�����$�Ūn8?�>WO��zܦiޤd������I*{�)gܚ�v�M�(����|T���)v�6ա~v�?�fk.
+HI���?�L�5E�]		�� M���~��V㚿��P�Hw��e3��V	�q<��٥�q�k�,N;5N��
�UXg�X�/�#��b.?��6�,4-���3o�հ/@�&�����V;
���l�sj�|���r�qO>�e=�X�U6��n���Iv��ڹ��Z~��S��=l>��	T�ノ0�?%K�.��Hj�H�m��]���0Ќ�O!5�l�i��tt���2���Z���Ui�]���Z��t�;h�n�����.��]�ޝ�v^�����ۉ�Xl�<RAk7Wb�i����n�ݿF�&;�[U č�yx|N��	kф7w����1�-���;��ed�~y��I�\��.���x�?��V@�	P�Vr2��F� <n�C+yS-ۧ�������QX�����
�Xw�p}HQO56/_���6���y���3F��<xM�V����
%�S��ͧx\}| �Z�+!�Tei��c9F�@�
6j��o����\�v26�ѨS;�g�&e�`�kbq�a�Ɔ\��}�^���d�$���6wH�d 7dp6-��JS i3 M�XdF��k`R�)��SNik~G�cA(��x���Yq�p�f�\q�X?��jpF=o�TZ
O��ݘO�Yh��>�'����RM�%��S�ƕZ�4b4s,�/��b��������:D�{�e{�����.(���$~u����Xc�S��9*�Q4��ͧ"�Ŝ~��8~�9��E�"��I12L�Ѥ��$�u%�@i� N)`����E?�(���E$���d�.�d�'��n����D���l����9}����=I�=�y�T���Ĺ�Leu��ȵF�DN��k��(�'�䓦mL	h����l��+���:����Ɯ�,�9V\I��IɋbwS���S���:
6~�R���sT��"2�b���m�z�H)�dꔁxA�ˏ�萞�<W�U��S���r�����Tpp9`gl6���>�,������RT�f��#�*��,����Q���5G�V��F�)��L���JQ��ޘ��ZrzAu�Y�rm��A>*��i�S>9l^��9;O��Ot���B����x��҇�T�u�Jn�.��;�h4'�}6W�3���Tpvr���	-�h�Ef�g ��<ǏĞ��q09 8O�Z[�ֲes��	����'�-v�,�؎3��pJ��[{�h�M�C3�&�nM�I@D�,A�}�i;Q0�N����
���*`bk�_��v��(nj����k��������J/�}~�?�U��GʴO�h�ּ׀Z3e�u ���P,�� �m�~���{'�K��_�2= ��In�'_���U�>I8ڻ�7dj�u��B`��������������$V#      �      xڋ���� � �      �   L  x�َ͝%���g�"����"��O�'0h��gy�����ӕ�#�Tx���$�'�T$�60~���1�~���'��8�T�Ӈ�����-��״���/R)���Z�`��O`>����?���ck>�?|��Dd�&����hr�#16���F��Ŗ;M��=�F#[l����b�s���]�1��{�L��a�����Ҕ�>��m|6>�
���ٌ�����_�����C��.�_B����p���!|����9�~ ����������������������#�S��>^ ��S��˼��!|��?ak8��1p�)>?���a?�4��>>���b��h�8��xej ���eЈ{h���\߯�����}��:�^��=y���3ztϦ�I�
g���&�������?�w����O3|k�t��_�"�8� ��G�g��~�i��pZ>�8DW'W(V|g��Z��l|��
r�m̩�3�{C{�'~�u�d�h���ό���6��!�I�
k<��4X_9��HFWM�I�s���Zf�7l��Ua~�����=��S�%e��`�G����{�`2�%��?�b��%g@�D|�g4E-����L����K�7���\ _���=�ZX��Ɇ��֓5��e#ܐ�����l	�Բ����1�n��fE���hd#�E�IS�~��|~�dK�&�5�����z�EC�$_Hm�`�7������w,XY.��[������\��������n=QI1f�!qN�+\�:x��E��`�a�����Ƶ�2��JՈY	�؄�����S�%��q�<s�w�
�/�3`A��v|���E!+A��Z���{����?礷޽���)��4;�p��fd��v���x>�V�r7ךj�p�̂�{�����)���1ۦ������e�W�f�`*��k+E/S���?�_��&,�
�-.��t��$+	ktj�o�gs|��o�W�S���
��:E�>�(���?^ _&�p�j�o�g0��"���{5ѷ�79��/}Ѭ�Ommeǿ������Z�VQ����;�� �B��BT�=)Wd���}��{?C���7M1���B�)�����H5=������j��=�_K]���/�|�:g�c���|w����O�����Ԗ'6�c�����U�[.��bLcp='P�ㅽqAvZ��I#��B���������$�M��U ���;��s�_�[�T5S�?^_�[���Mr�`.�/r�e2z�$w|��h��u�lSt=^���]�()��?~��R�낋��]��^ _$h�{�\�VI7�)�N�I��	&��q�����O�.�V��6A�w���x�l��74I�dGv��`�=�8iz��ke�Gp�Jy�o?��C��%�`�d��Nk�w�t�m^���j���<�����!@w�$;`��È�Dt��j�����'�W$��b�e����9��>_4�COP+��#^ _��dSj�ZS���a'�)��5Ձ_Ő���+��b:��2����9��L$c�ƂbP�Μ������BmZ���p-�Q}�j=R�,fY��Z��p�17ɒ���~��_ _��'�Ei����.X�]`��VOZ�g����Ηeṵ���n2�-2�k	��`B��"�n4�WȹGc�n���#�g�2�B��-�-��tt�������V�v||~�r�V�
3�#�1�i���%5���Wq	���h(RE�G�A����#l��V ;T�i��c�~Q��E�gۇ�������]���b�^��
���=�k�j�6|.\ _Rb,P׌MQ������R���j_%���\���8�s�m����H��EA���?l�?_Rb,ơ1^Q����%s}|�y^�+>d�Vͯ���H���foCa���4�-W�5�⑫�~���{6>��8�T|6Qp&EZ���;��e��bv��C�%���{�s.(��bu\5���Ģt��Nχ�x���b:��|zG;>=��K�}�p4�
�^b���ˮ�^�.h��s��a�t�k�"6�T����v�3=��a����p*6&�����v��?\�JN%�j�?���BV5Fq�ˆo��?��1�r�������^ _��R�(�W|� �H�S+�]n��Q���/��������wO�zk���E8v<�.�1�����:t�׽0�ju��t���
�=��U�Xg߅6�-��)���#9�&V7x~�XU���FrQ�;��;}�Ԓ�Ew�|�[3Z��+~�XmԽય��	����՘X�b�������L���G5���7���2����+Ԯ����ƾL�v����ۂf��/0�EyZJ]�#*;~��t����u��EZ��l�s��_�����7�����=��gq�������M���兾J�_�K���_l�}���ǫ���'ݘ�;�a�곙έ�m*�,�>��G�_��/�t�,gt�(hQ5��=a�[�����?�����tt�g�--�G���
�}�69�Wg/�h#���N�pt�~�]@0���2=��Լ.�ͦ���&_��H�sK{}f�)�?ڿ��kp�8�^�|��_/U�ԋ�6m<��	�{��>,ؔib���\���3�	2���k��v/z��(�2�]��|�Fw�ó��a�:���a����H0R����r^攜Y���P4�f��M�Z���M�o�KRe���uP�Vv1�x�3z�bp��C�:҇���N�N܆��Z�ɦ�]�u��'������$c�����$�-޼㋤�_>V?1�hZȷ��V< ������,���D3�i����6���n��}x9��<��i���~���7հ7`듄�ǂ�M�n�q	��]NA@K��%R`��t��ͬ����)�O�<���oW�)d��騢A�:�_�\�ք8 �,J!A�ͪȢ�0gl��.���B3����/�_��Z�8\��=�S�g��|�$Y֋#�ULV����?�qw?}�cB�;�^�l`��m0˪�>�DE��׭B�MC$4�98�Y���ے{o��&Kn�u���o-�䓊�ިG�������\-��K�#�۷δD��K�14��r���dYЎ�zwvڽp<������p���6SjEIt�0R��L"�V�$)�h������;��X5���;�^T�+����	L0�6�8�m0P�������|�A�̝ׅ�֬�rt���ڝ�6����2w���3�(��hCK߮���KAU��#���/��ȟg?F3���4o)%t�a�������c%t9�<f/i�1b���*���C������������bќV\�ޙV�I�kuO����>L`�uZQ`�MKsj��Q�'s����$w����jЛ�/ؑ��Lj������V?_���FR��;�ȸO��M��1�'��_0�x��["��"3ﱍ?����7͵��ӗFc4�{|��}���-I@c��noC5�Q�7�n9��t� -M����'v���n_��Hr����ZÙ�{5@\"��x#��M=+#v�MhS�H��۶�	$������;&��~d�ڏ�\���}i4�].8C��H�����5��qxaÈ$7�ޫ�25�z��� oȖ+v��K�3��m�ܷ�l����T�/����۳�5Ag-˷�H�#}��~��Ct�<�:N6�x�1�h�=6F�&cC��$��(���d+�x)�}�HL�{����w�7�lҙ���y2����>��HΣ�Dt��n��yx���8FwHE�?�Y���~���a����� ���C      �      xڭ�Y�9��ǧ����Dq�Y�E���0���4��Z,���"G~ɢȟ�`�?����\�?�;����9�B�������~��W�__��0��_�M��Ϗ�A���A���˧A?�{p5�ub��ab�4"�\։A��2�L�^���jl�6V�x��cH�mD�\N;�Qџ&����!�j�bu�F�Xa�%g`�ub�4�&�`JC�Ȕ�o#-μ	�X�[θA,�t�+jB塍�s62����}�ƮX��q�6��䜍[]�3�J�A,�-lj��>}������K�ށ��6�^�0"ԍ���q�`,`�V�8� 0�Ml_:��٫l�t:bc�A։] ���g��7qe�� ,S���n蝳_F�Dq�9Ɉ��t��a�82�&��F�Z�ub��+����N���HnL!x<L<�یXJ�!��ϧm<����n�<9m��C\���:1[��+fj<#�7#R<�S)�%,�ݜc�O<v��
q���r$y]V؄էb:G<U1��?v����ē���۱q@~��1E�x$VTJn����x�xN	ysȾac�'K��\�q��H-]���Y�a�8��'b�GQ�⠪������ӆWɳ�u�x.��Ȑ72�����9�ͼ�t'Vhp.�������w�����S5�/�y����g�u r�+�z$�o�j}�y�7q�qP�ؠ�")���6R�  4�X�4�D�m +�p�x.T��Z�p
��N�x*��B�!&�.L�OM��ۆ�����^1%+�Je�8Zr��S	$�*����6�����K�`Z���WL��A��(���r�Ɠ)�V��xP�-胡�!q��GR^����{
ǈ'�[�X׋�@����\��6�C@\!����yh�v�	�&�SB�wf	�?m㩜��ͭ�<��Mt!���-�'B	��Mm��q���S9%�}���i�9?V6��}�%�(,'rj�]��-v�&��n)hY�n7�T�Ɣ#�`4}|�x.Ic�;&�x܍�=fK��b�{��6�L ��7� ��ěB�'��bJ�XR)�U7l�R:��b�ok���S)/"��i�yOM���i=D+L�ۏ1B#��s?�S�Q��&��x9fm��{�MW��O������ &`<L<��%(��9m�����3]q��S�"V@ވ�iO��X���1��Z�9O�<�d�u�X��#�b- C��?�BA}� Vv��Ib��N�cB�-b����O�c��7�R
6��xL�qt�J�\9�+(��z� $�����1e)!m����6��y��G7�>�s�$1ww�1���1����O-V�����I8�'�Qu�F��P3��x�i����R�K���v�ƾ��C��n�s�S��~� O5��&��x���4���q�s�s�4����!D>m�9����F_,C�ws�9��B�°��n�i�)Ao��ˆW8�ﭱs^1��9�B��
�]J�#�*�X{�ؔ�k1�!f+nG�����z7gpſ9yw�xҏsLۏ��;�'���<�r�}��gb}�
ι�H�q�؏,WJw��M�e��+�z�l���p$�I�a���{�����QJ��<�v�Zzg�F<7�M�a?���3��6:y%�K����p��
��qOei1k�?�����ԦH��AlI:����K��)N;Ŝ<�n�!�23~'9Ly�Z��H����ĳ�G��缸k��x���1����[Ǎh|I�%⌣���_�n�X�����\�P(����;
�O�hu�r��||�+������+�߷a$�
��g���<sc���ǈgtPuܝ[L >�P�?+�Յ8���7<�"T]sa�Ĉc |�vW'�J�X�	�����_�n7��Gg	�9ߨ�`�ش��!��X��Ӄ�3��r�����&���ի�e�+�<�ǳ���G#��J��8�$��Ӊ�W}r��bQ��6�R�F,!��19'O;�$qd.'����A���WL���3��B��4�T��9g)�������qpn���˱!<�\"�.��\��Jk_���ej_čW��1�2K����W6����m��8���2��EO�:��y�;
&mL.���\����6K\�hf�Ɩ��秿�^M0<$���;c���r�3bRqo�Ⱦ�Ѥ��T��"J]�� �5������
��l�y�&�(����+[�!1�#^��<r���iϛ%��	'��g�����C�����JGl�<I�b���Y�>4gcvѯ���wՔ|�i4�zHgl̹���g�w�?Ilt�ƅ\[��H^�6Ӛ$�э��~톃�l\:����EL��+�;�#6�&t7�4Z��ܿZS�Ώ`���'l�}pa}�E���n��;GG�qN��q���n�S/��C:bc�]�G+.b��O�ș2�Kw�HRpJ�V��
q%u�yE��['��B���B�id�"1�q�VL���羿Yb�B'l\�Ĵ>��cE)�8���ݙx\]���A��y��$q��􈮨�R^� W�y�mV�ht{^���p$�Y�ny}�11���j��Ub�G�<�MnC3�w/�,q*|$�5��m,^��ǵ']�o�.:��-Fm��M̏�7��2��"b���͖n(!a����ڈ�Pm6��V�ظ*6� ֈ���Nظ���`�X���vm������4qt�)�����Y✸1q&����ﻏ�uo��E0�Kjp$��U��>}���
n�N8c����n��-���6pMF7�7�ʉh�@W��vs��K�6UOD�����u������B�QҴ�����Vʃfʋ�%/�
#f�'�ٗ����3�l<Il����q��}y^C�=�0�/�q��iY'�&*�!nTFo�h�Սc'��uvl��:��D���B��>�QS���j����ٗn~�tb�!�H��W��=o��h�o���D��g���F֋�u=bb��q�Ĉ�l�OW�('lL�6l���'���:e�<�p��1���GlȼD\�h)v���5�^���Y&4�5���P�HBO�8Y��b!�KĒ}:b���'���5ٗn�C��۠}j�ƽ��>��{�~����v�9s��z��"f���q3�N�5��n�Z�I39���'�R�����)w̴\��՞���:����m�kmtݐ�Oq�:�z�v����%NG��k%l��j�Y%�S��0�h��C�1�F~�c���[X��׈=8��B�=�p�OR��zǺ�u���C�ڐ��VO\f�#BY}�E�y�9�niָ�b�x�f�4�L}�Z&�1�q����w1k�bq��'���r���}&�zKS��2�Y��r}$��&�\=�����_oi��%��>��#6&Ǽac��4�D���)��Z񯇉g��/��V�����m<�CoOb'y��O{��9���zk�|_�x��X�\�K�$���
�`��n�M�u����G�縮1��MmIgV1-+��܋0�{�x�؄�_��?Ϥ<)lr�~݃r���p�Wʣ�l)H�Җo���G�縚���4�@*�Bw�@,/S��e��g���Y!����|����@��~~��>e9`�֬,H�H�^!�܋����}J��e�p�A��Ll�X��{��t_�>K���5���M�w�y�E��bBw!� ڟ-��>���r9A���eb�r��L�6 �8��˶m��^��95f�`���T�AJ�?��%,��Vm̯k��G��ϟ���Ї^1+R����dc��^�Y���@�^t.���oa��J��x�q�Eb�Jw��� �LI1����������8&(�}�6�Kμ��Z%v�"}��	�Keb�r� �A�7�_$v/�l��
q	ݷ?����.cY�c�_������U�#?f
қ� &6�X'���q7a��$)��RY$��	��<{U7�6(�0�TS$iͤ�^a��!���<"�̵�9Z*���q�/�x���dzhuTMt�@������E`~!�n|�x&�d��D�8�uE�ө`����ٯ�uD �t�Ɯ�#/ʊ�&�s �  �7q�����\���	$s��`U!\�����Ɗ��Z}�q1���C,j���g�<�� �J���"�{1Xv_#�8,�&HN����J�/��o�G��� xt�����Jl��zK�W�GHli�RB>�@���]�9yV�*$v�+� <݅��Fx���>�>0ܫ0�4G��~qw/.�u�?���3DCh˪��E!�w5��=�����~����&-��W��Z_y�V����ͳ�}��DQ��\Y$֗S��αi���*��xfE(����=\��6������n�Ϗ�A�kn'�Z������Os�,q�XG�3kXT�<������r�C����۠Xk����8��a����h������8rbNԞ%�?�}����ݮ      �      x��\�r#Gr}�|E�[�~ћ4ދ«�b���8b�.Y$4 ��nEm��}��!AMJ���h@��S�'OVg�Z�.kq�W�S���/W��2$���=m�.lֿPnb���un�n��zh;�6����a��67m)���6�m����ޭZ.��k�4���᧬���3�!1ny�<x�({�YXe��VD������$E�8�M{�.��+�f���K���1�ݿ16e�RT������{�m:뽵.3ٹ7����m8�M�N��>�M�j@\|�[o�.<i��#��Q��܅�vXo����5��B��/m���ڐ����N6˅]�v�(��$4��h(f�!�Ng��J�n"�ʺ�����p�vM!�T<~j��B�-��^r-Ք�ժ��9�5̸��λ�81����c;�Ms��unҮ�[�M�6��p=7��B��wn���#i���0��]��W9��N�׻-��n���cp�W�aK�����!n�_��p{����p��ݶ�M;�P�7� �jۇ8����S�_�����Qs������ux�I7��*�6��&�D/�L��x����t�$��oR3xq�I�ϐo�6\#v=uW%��xi��u����r��^�}֨��ۄ���m6���<ބ���Q��(}���M�Yo+����*�M���b�P�Y'���:����>I3X&~��yU��U��ς���Q� ��5zn*��ܟ P��i����Vg���AyKs����kD/�v�n�>��0����-��+�n�Z��̱�$�I�uh�2�n��X�~Ċ�49V8���uBqV���/*KdT)�H(�)O6i%�T��K��2S ¨�|=�Q
�@$1���o ���YV��jX�D��~�ۆ���-�5O>��\��19M��h�&���%�R��ʁ>�@=�F@Ux!�B��u�$d8��r҈I�`u�:"Y�l�e�Ռ�q�K��C����5�|K��q�"m����&�?����ǀDQ�Ib��1���j��]�$�����*�Tu/x�_Ww���8����فsF6Fm��v��;�R�����)�<dqM�J��B����1��$_H�2�j����)p+$���#�i7>�Zu�y������4�r�9�V)�t�����������UxP�k+��P��Az�_��՗z�^$Ӻ��UT��,�+�~W\EͽJQ������MB\�W�)�T��׋�#y��`E��=pSVk^��9Ή,Pe����('׿�@l��Bf6�bs���:�m��%E?�Н�E����F͏���؜�*�2?:'���
5��w���7�}����w����὚�k��j 9�-tf�X�,|W�lއ!�4`y�U�>�*�*Y����:�x��H��P�
�,|bhS�^8]����%#!�4�tTAhx�'�6�q�z�5���������"5��Ő>�8�6�S�n ��;j���LE����ڻ�f�o��l��2�7�ݺjҺ�}@7����R�0�F�j�����K�蜡�2��Q���I2�MNB+@��+aÔc�W�:�	�xfN�'��g�����w�Х�P԰��i�5���6�f�(���,O�=�pOW����������̀�ș{���h>�%�N~f�"}m�=4כ6"�R�;�"H���A�q�jZ+jnk�����Me�tF��G����v�SH�Q���T�P���C�մ)Z��$�|(�.dC�FKctR��鐲�j��@�V��!���9P�)z���9���7m�a��.�UۭQ�Ėß�}����[�œqd��r��U�r��9%��"�|�j�*@�~&�j�$���X|]�&�֛��pO���Jm �C�u�q ���IY*� A��"��g�f�K�x�@����JZ"��%�8�$�Ig�AjOv��*���DcVf��@���x�� �K����k��ps���a44���@ãCiƊ dQzD��j��ބu7
���m8,M�	u�/J�Ň��6M��NYT�)Ъ��W�Ky��2Z�fڢۻ�9D��}{�b����zsص�{����T?$�R��OK��Q��n�f��sn�!��)�Ԫ��A�i�=u���r����M�~ǻ���}�� .��)���f/��U	��0�9���U�X����8�@�'����px2~|��~x���ώO>9>?X]_�x����ᰭ��vC=(m�en�h���l�}���T�T����#t@�<PߴwU�7��s����n8�Yy%�䪨�^��c�&�Jy���~j8_ԭP�k�~�
�v���9���K�t�;���ڿJ٢-+ĲOQXc�d�:��:�
]�%E�e�`'锏l���Zr~>�gq����tF��!h\�Ռdώ���,`�e�!���E�%~���t�����7��$f�}�g}?��Es���%l6�=�g���W�*��e��*A�Q�.�EE̼p#@[ܳ�HBA���� ���n
�j�����"e�S�F0��<��@k�o+�~��O~a�&�|8�'�����it f"���h��A0�َgV�����^Q1�]��7�����y!�>��)�WneZ-b1{Vb����ٯS�j�[��h��vP�D��&���L'��O���U�M�xt\R�6�B؎�����LX�#0*2HFhP�4TD��Yt�))�.ʖR�
h՝,��M��;w{�z��_��;����^�[��-9%�ky.Q��5�@���ݕ@�^R&3*�rv��4n�q.�n�j��悜�$8�Ϳ8MO;��&�L��7)E���ܗ"�S���CO��O���v���V�%�_J���{��7�V�_=�:���x)I��EG�й��X�bU���lL!�|I�p�sL��!Howu���VY����X�I��ַ
��CI��X��;�&���h���pR&B�	͢.$m�[������23c�p��-���u��ԤʩV��J��8f4Q̓�;ڃ�joB�h�z���5���{"	����]��S?��: �b"H6R.�)L�2�yK���*ev@�Tm�Ya)F�m��!d��n���4����� K�29�c)���m������G9 �J�P�C�J�Q(I������U ��8��:A��^����`V!&�U�W���73;�׶��rK��-{F
[�7�#�^�����0�<�?�2c���c(e�(�"tn�!*e������R�U�&�t@YP�d�f��̾9�%ؙo�Sz�0^������������ר㹘��������W���b���W��K�H�U�D'�E0
�l*LZ����^윋���)0-��T�]�:Ìu��NW'=�׫93Q��r��4#��9,�SL|�,��l���h{rY��e�G�"P��
0#�AQ�"R�d�,Z����婶��g�p�1�v6g�Ei9Y����7Z�z�bnU�ĪԬ9,L5��_\bM�8|���]�kAz5�K�eӵ�o��P�υa-Vg�f`u����G���a}�"	��Wc(1@m�먎׺��!�8H	�� �RQ疅S�%H�0Y�t��;��n����4�:44�N$�2ϟ�X�g�Ǆ�x����~�$�ݰ����:R>��mӅ�vn	Bu�~��9�II����><������0z����Jp1u�io����X�s���D�;s떔�?����fX_m��<��|n �Sڬ���סk�g�̡ٮ�o��]?,�o�-=4��8O0���N�⤰x!$
��� qA������ڂ\��.��,~�f��67�k��#*�@X6_F��39m�W4��ˋ��@�M�]���AQ�KYT��8*����UHJ2�B��$���]TE�s��������.in���4s*�G
�O!�um3����S�����ѹ�qnq�<nv���3�8�m��7%�u^�����O`��fS�j��gw�^���&͈\Ғ��&��/���)�v����C�nAC�y��!}�A� �  o�wBx�����L	͂K*D�=�K���%�-]��fD��.m�n3X�|#�pŁ^|���`LD ��ٝ��]�� �~��e6��:I�v]�eh��iX�>֙�@��j�4��_���ڒ�`��LP�+L=?���{�4��0��iPE-t.r姡6�+5������@m��;���v���5��*�;J�������ci����]W�uU��|;4����o�*��������?�So���C��<ڀ�h+�x�/�'"�E�)��YW�fEyn�⒜�V1�=/�DY-�ĕӆO"��o��A7^п�ھ��ڛ�Y����P��,��*�_o�m=n�Ҕnƪ�+�׈�*����P
�]�[��fP��2(J�T@O��,DQ!q���i�Q��)�T۫�"#�D�����ު��ȟ`>����Z�c�l�is�Y4�cX�O7�wD��v�3��v���z�a��]%�vN�1'ݶ�wNYP�B��?�=bBO'Y��m��ց��et�����
�8�i�*��I4<q曾�C�p81��[�z7��}<W�]?�D �(h<x��v���M��:���a�\9�l�<c5���9�#cQ2�22ÓL9烓���HB�xL%�Y��35A\{�>��E�x57�LHgg�����Ϝ:���w�W|�����>|:�Y�k��0TE��!� ����D�|uN��G�U�=��X�x܄-�#��R��W�µ��Y�[��	�P��ީ�����HfE��+�{`8n��EOm��x35��>OҢ!f�.ʨ4׾E��?�����*�{�+���]�Z���o���~���6/�ʯt��#>7�gE�bdh���2B+B��X��L��LM��0s5�Y�*���.��#�I<b�E��X"�S �# ��}��AY��V�%��N�B"
�������V�d�)��ՉA�[A�O��+�Z��s�A����?�o��qz�k+;y��:�R�V��{X���N��K�$+�G1j4sg?o)?Y�$���.���C�h��]�;GRB�KΛ�%��~~���j�+��E�x�|���U��F.����ތV������g<�ƽ7f)��|~���*ޤ?�"J��N6٥�ӱ���`u�-"���ٴo.�����^	}�Zo&�Y���CE��qR�<�}(_�I_7s��������1*�����l��8񛕎��MF�E.�\,}J�vfoT�-�.xf2�tIg��;e'Vfo|���೦/�Z4Ž=M�wo�5Q��V�F��7���n5K^�݅�}�%��J�v���&�d�ni�0ʝvro��%�z�u撴-���=���j�[]t����Q|	�>�N��o�t1����ZoT�%+����U�	�Ũ�>�F�Ky����gꎬ�������Yw�
����p���Ko��'��V���Ku���3|�g�����sMu}k�]�����հמ�~�7Ē��ހ��1���
�T�U�������%�E2�����َ�Ũ4����R�;��NK=m��m��TDqk��RΆ��V#bVQeW�$Z���"Hh@�TL)D.�M�%�Jqzu�R:f�k�[��2����A�.u�x<�;�����dt���,}9F��[��:%W��ڼ����ݻw�B�ķ      �   5  x�ՑQK�0���_��&i���	��胯s��rW�d�f�!��&m���?�ڞ�����Z��V1{�z��_%/�/�f�x�7��e�PR��_��y��`Hr�������p��cZ��[R��s���9�U�HM�\�O���ܺ�!j��s[�j7[t8je�ܝG�Ѯ*��>EE=��@Qv�Nl.s6�@�ڴw3Z�y9m����g�Mz����o,���}�w$����<�A�˭iM�]�i�"�s��ш�2��$���mc�(%H�H��Y&��so4� 1�\%��ŏ,{�Ͳ�9Q      �   �  x�՝�o\����%J�!9(z.�P ��F�d%���-����]�5
���~����q��[��E�nh��Q�M����ŭ'����y�����#?=<�xw��o��~|����ox���?~�f<��˻��ݔ;y����ü]�7Ϗ�.�?�����}�9?�|}~���������t�U�� ���;^�����G�;����5�aY	W�FñǕ�WV)[���G��g�B����W�B
h�_�r�UJLөG#��=���Kg�(g\��z�ƲkH��#�\������z��g��qJ�A��1�z�B�<=�G��UJ�}8�h#\\���J
e
���գ���G�q5mAS��4���D�S��=昊6ڱ)Ur��F(�={<��
�+��֣��`���J	+�r"y��6
x���tʆ]�z�"��:�b�%�JYW�:�c#�ܺ縊36F��c�ZM���6�?R-�i�:����m�c��y<��>P�:u�6��U!A�%�=Rh�g��(]�+�h#d��<�������<^=g�$�qy�1���J)!;�G6r����v�I����~��o�Y�Z�-;�b�&�6%%�S�F��K.~��w�����?o~���?��/W�+P܍�TjJ�%̥�q9,�Q~������0?^݌���ү����1_f���������뛻[��6_?%�h篓A<W�u�Z�J���!~!��X�=R̭�J9Rᒔ��hK��Z��G�:%�+���#� �;�)*e�!{�h!lA��!�֊���-�м�<m��=���j˲P���8	2N�ɵ�>0e�r)�f�B�سG��9����W�6���D�����eS.�n=��yn��,Ԩ�bD�����לس�^xP);T��U�Xqx�{V)'��������AΎ�́\QTJj���~#���6FkY�C �k3�D8H�\=M��m۔T�n�7R����欐�����u��D(1�W��:A���}�FS�k'��Z��}D��Я]��1CmI	�xV����s�Wg�%�E,�O�����Ѩ�B���$%!�8GN	QH;hbS���-�r�Y���$-V)1�{Y���gt�ė���i�r���m$�
�G�$�v��3�LɭG�j��3��v�զ��z���f��$m>qSb�N�N��CVs����Zk���
y�h!D�#y��Z�)g�:cj$����=b�	UJ��^=����C����J9�vr�{��ؚ��8f�b��F�����e�ԻJ	��W�y��<��r�N~\�C�Nw�	��t�QZ����
z��Ǹ�����J	�������a��>��J͏GY�5
� ��;�~�
��k�h"�Q��ݱx�Pg�T�QO�� ��Pé��EJu"Ж����o�JJ�O�A.RR_�+2�
��P�J �=J�t� z�2�:��:�h l!�����h+���]��,�ң�0J� ��c��z�*��	>=����<�G�)C��@اG!��A	�z<n*��r��rqʯk8ڒ*��~�Z8�)�Q�=�,6B�}B~=b��44ʑ�lp�+&Z�#��`-�lʵ�9>=�[���q\mgL�Q�|�w���F8k�ӳ�Ydu���,������<[p<�:�e�#���l8ڒ��B�=�Prn�R6�>G���=Fr���'2T�Vfv��BH0�� G3L��R��t��F�uw��q\���1_V�L�rq��D�3s�~����h�=q��B�b9����<�=��� �O���%�gJ����_�T���Ҿ�Sm�3CSj���D��8��0C�`(�F(P��8�(a�*���N=Z��u���%p�('�)>=�q��J~=�~W����h"���V���ʩhQ�r��w��h!��o޼�WvI      �      xڬ�]Υ)ήy�=�>o})0`���BC�ê-ui�m��*32�͕���@.�s��Jw�?���?B~���*-��R�/r����q��q��_>�#,%��׹�+������Y$�����ޟ4�����1J�a���f.�������g|���U#~>�����f��)�Y�OI����4�d���`Z�i��aH�&�1��o�Ч�Ä .�0��Jȹ�abv�>�Η'0�F=L"'��TGH�.^���xv��jb�g3;O�`���?����3���-�"�0��������Rq�d���/�����>��b�<����8S+�-������q!����&�����V��7j��j���!΂	��&C>$������OB^��� #��OK���I5ӗ����09�9y��N���m�
�4����f��p�1/�o�.�7x���A2��+`F�����v$'�Nh����I��NX�	{�3#���	���!߷׺���0�AM�\VH��K��&veL޽�B2P�\k4H&�~R�&0�Td�Lη�%��h��4��I8K�%��ݥ���޽d$��тEI�9j$�9��u��oQ!,1���b������z�%�#��׈d�,9)���o��F2)�m3�	aڔ��l!�@{�H_�1����=��D0�\�g��g墀�{�`Ժ�C�
���Y�0���@�`�T��fxV��bެ����og0K��FM�M�d�����7��<I��M�6�(x�ż���]�bf�A+`$fd3�����v�U�@x�N���K�jZ��+hP�^;��drʱ�0����Q�ک��󦺆a#�Z�������i'���!����7������+$�����`DJPHJk��0��&�d���V�n�!��"�@��8שEL�	zH�)��a�d!�#Nvjx����*A�M��"�|0-�/`<�Ez�ɑb�$���&y?��Uf��`h��b�S�.;�>kg	�?5���/A�Lw�ݝ��{����/�HfG`ÎJ�ǅ>���_��0�5�&xrf������b�0�[\�X ���aX����}�M�szQ�	-M�K(�3f�O|)8��NL��xI&�l���V��`0Hi���J�����_�"aW6���)�1�!O��
L2�7����,���Y�%�p�����DK�C�/���L�-ka�?�ş`���'��gb����Sug�a|b�d0��D� C�ؾ�*����5���0!$R�`ZZ9.�`Bq�0����i9=L�b�RvإY�o`���&E���d2qכ��a8Q�$���JO�d�a�������8�m���[�
����E�F��J&��O��X8�g��7��`���jW�x�1_�)]�_�]�^M�S�Q��i6iz����[qƾ5���9�;�&rP�@JJk����G�}�`�p����v��D�·��@=6{j��.�0�Ύ0E�z�!��4j�̗���`3ٻ[>@�A�/6�\ݠ�-x���26��,0%��0`la�yu�yg8��2�"��f�o������%Μ�U"�Q�`R���@;;µI7H�<+`�8�J0p �������cn�"a0Xn�$� ����oZ�{���K^��);��`8�eN�M�-��Ά9[�P���/��f	���$�|��AyS����r7� 5A%DN�Ƞ&	rm&�4V}b��s�K&����&ɼ��'�2�0R�0��ʘA���t7�!�`j��Z��+r�m4/�'k3�U��	�o���`%D�yE�d�o#��d0qV�c��THK�<�.g��j�/Evr�1��O���ðT���ySq'k��M�8f2�pQ�`&SB�� �B��"�L	��ɔ�Z�L�wm�OM��d�6�70�o�����a@�)2{1��ʃ0�͈��w�D�;��i	J�m5�3S��������/��+�ov��av9#�À!o81��ȿIAS�hsԴ�I0X5Sf����;���`δYԴKN�Q���B�0�� �@1OΘ���Y����@�'��Γz5��8f���J\0�F2�R��S30�x� (�H�X�9��YE`iiF}���w� �(7I�f���esHE������nn50P��4g�3ŕ;�Z]��I��s��^M�̻תH�b���
{}��3m�P� Gw�Qso:����k>~q{��ըMS�nDE��\t� SJQHT����]<��[��,;��#�7Z���xJ$
�ÀZjq�n�40P�i=e��$�wRf3+�i���7�׆�7c���aX�+%��� 0��t_���+r�!�@��)39
'�(	���E.��B2�/���[��x�8ò��L�4Z#L)߅��&.�0�.;�ޚ�}�6lH(�֜=�LO���6�Ρ!,������qI>%�f�s�%�n|�*B0���+���^/}���{�1�,N��[)>�$�`63����fJJ��$9�p+�:e�;!�@63hu�,�U��`��yO&gv�V��,�0��bq�sp��r��@����(ū/&�0��]\�<�*�-�|H9��G���Qϩ�'��˫�n���m,荱�S&S
̀� j*���05a��r�滥I2����$9�5�F	O:�y�:I��O.
d����i@a�3_ s�E��\���fp�O
��JI�g�z9ՠw%|Q�4ޒ���?7.~�wr_o����T/Ym���m��|e����Y���j�ⵙG|29>G�n�9�0�3M֟j�0%F�2k�x��{Df-^/s�0m�4�p�'T�f�U0>�;*�@޴v���q�v ���
��O���4���;�	�`6�G`}1N�ӝD`@5�ќ���")$�ř58TL!��i���^�-V�\Xz5�~��"z��!cMK�7 0�`VhU�LAD>�T�W��`�z��Ї��r��̇` ���'!�����A0��x
�PAD/w��A澪��޳�\��6���~-���F�Ъ��2`�
��3�e�]�}�L�ɯ�O`�Z��M���|0<��'\���8܋U 0���7����`�TW_o�V���^[�0%����}�f��"_5���Lk��z��M?���Q�z��wátr���jf���ׇ�t���P��%�&�@+��o
�N
B0Xȣs}�&��Qe(6�	�]�A!(3�a�hJ)��<�BZ/�̯�[7��s
�,���~�Ē�4aL�Ự��<{�`�5�J"���R��^l�(e��18SS�т�a�����!$7^,��݈Y�$���+`���_��I.9|76� =�'e^�>e�7��W'q̀C7�,E�'\1�fFӏ�����B�`��f��Q��]�yb3PmiL6H&�� \�޵�$��sHo39&��	��l&&�Π��=�
3��Egf����0��$�`2��
���LJ�{} .�����z�q[w�����V�`�L&����l�MIܛW�+o5,���oT���
V��N/�s��r޷{���YK�2�����}�<�� ��'0��/x�0~�Ʌ�#��8ki��҆!��%��7Y�>�r`r�+�tn����2�L��5j�2v^�;�̈́|��`������fb�j�����?�r`�r�IJمb���-�C)���k0���L�Z���LlM�m{`��4��`�}���'�6LN�^�مy�kO�aj�"p��5���
z�<�k�����i�E�-8����Q��K��]�i$�E��7��"H#( �}X���@���/�!�?S���g=��LF�r�Ǽ�B�[�rNE?�RS)z����`0P���B��s��9�t)��a��hԄy��e(gv���-�f��OC9�S��h	��9�ԧ�=;�����٫A0)����O��_�û�S�`j�Ԩ�̹}7+$�o=W��Lvw���p��e�g瘳*:k��y2w��!��Z���f�l    �{Ir�;���ęJp�DG����o�],0�Q�a��{��W�i����Z�|b3;�K����N4�I&{1�)Q�6�`0�i;G}љ(�-�Z9o*��y�M�jJ��8��Z_�$
g�d05-'^�v�P�D��m{������ ���O2�Mݍ���n� 0�����Po��SH�N#�b����"p��;I$7�����Y��#0�N�0�7�se���w�
�������
�ý&����>� �M&+Ԅ��nXCc�>+Ԅ5�}�`X�:76�=��K]O`���ԷM��V��'7.�w�l�9��@'!�g�;
ȳ�n�xv)�aA�R-�P��s��Q8���~���0E�94��(�vN�^�\�e>o��<��`ү�B`�<9�f��HY��̪�X`�7�BM�kO��%p.�Xӿ0���?�	qv��=I��`qf��>5�W`�ˀ1Ȁg
#��9G����@%�d� ��}����i�x�� ���P̀��7�#��w���W2y�R����� o��@δʐ�ג���_�[9�<��%eFL�7iC0�g�d�h�o����Ww�"���QY�SIO���M��a��(` �^����K�.�#0�ɜ0c��������V̆-A������գ�7����|��ŀHs�V�-E��q��w\��vᚋ)h����I�=C�� a���v���x�15!Ds������T��)��	̖�v���6
z����0��o� ����C0��:]��}+g��e86���`�`0�i�ik��vzM8g�l�<i`����}1���I�(]����܈��'6�FɆtP���8�&��J5���N��@���@�fd�����i��ݒ'w�I
hvq���=p�av�_��~���Cq`���I)��OS=w`������3�|q����[c��7�����\���Ct߼&̀K�T0�d c�z��X���?b|w�3�y>���!�yvOs`x��0X6�[$����0�3�Q�>g����:�ż��7p�}��f�Ҋv:��Hb�0P ��!Й������TT2얛�;9��@1�����f(x�	B0X���t�`����0�@�8�I��)��Jc2P�$q��7r�kh����GR��i���;��@y�Z�fp&����P��Mj��
[`��}SSo�U��5E��y���U��$�N�b0P���δK�p%3V/����R+� ,�$$��S1���v�q,3��!��)�5���7��D��[����@�C���A2|~�_� �����и2�d�p,��d�})d
��:&��#9C�y{vT�@�L�.J�Ȕokw=_��j�oM���n�>5Ŗ�zqH�+�i����>�����e6�jC���|���` �$w�J6���&1�fRHݰh�(��ҖvӒ���ĭ��S�_i�Rة���2WC5��K��V&��!蝻�(�/�^K1���n�����$3q�}�͗K�wi�kX�ū;;aK3X��{DVY�(�$#���$3<C7�Lv�e�d�ΖW/d���^F��O��b֪�K̈́0�;ȉ�@A&{
����ҽ�8��)[|e�D!�I�켛dCe���ϙ5A1/�_%LH����d�j<�>�y9��6�yvΒCh�φʿ09���dJk�n[�����M2�2�d��NB,`��+$K9OP(e��֊�������h��d�I���K1�`1o�aص-.�o���&W�Lt�3࢐�K��0uPB��t��9�'�%�Xz.1:O
(���i��r{���/L:5�B2P�)9��7(�I�d0.�~F���z<)$���Rcf}�R�f Ji��i�V�s&�r�c�`@5�EM_��vR�($�p���8q��j�2��&qQ�g����&����B����n7�Ш%���<q&�q�� #�3�W1�G�����3�+�B��]zx�� g�XȰ�!�ݗ�O�ɬ�$���"I)xf3i��/���w�b�������9*�<�)v�%�]H2����!��]Z)Ԅ�li>��wp��:�&�ڛN[���~��sV]��If8��`�w�
,̌�~���xʷ�`0o�2՛;&�{r����澂����WN��%/�
�U&����z=�>���{��W�w�|/j��3���V���4L	��#�M�����R�5/�����g2k���k��եՁ��]?���	%U��R�7@����.�OM~���kj\˛��V}O��|o�m��(O*�-� z�ٿW�p��>�O��Qn=�{gڨ��jڱ��"0���K�C����o����gL-2�&����@�^�5�^Ma�宻�������oQ�� A�*�>S1��@�9��u�mU�a��{
��^��2o���`8��[K#�h���|�5��<���k|�$�
PMyz���ى��@0P�e���V:!5A�=d��7��RJ���\��^0t
��攟T3c�p4�d���f�7M1���uH2�O���˽�`̶�a�驲>K����.�5gL�<@`0g��:`���a@0P��D-�)^�+������79pg��1ȳg�T�0�ywY�y�hy��oB`@���B^ک�����缢3���\4&�~�y�[sJ�/M�V=?	��v�ԗV��.Ӗ���L�R�Eg�)|w6C0�g��b1p��[A��x������QB��\{�Mg�Y�����E�'�R,I͐����>�0�WʆN��{I!(ά�a��
i`0o�˲:�!��i����f�0�7�����=k�d`��qH0�3-v�`2�lO*$�8SwίU0Lw>��L��3���)ɥS��7��/������4��N�i|:̎yQ!ĳ��15}?�]���$��v�%D�R�. ��l�=s�/��^�"�7��i`���k����w�#����\��WH2`V!���oA�AFo�_��5�"̨u�3E�\R?��&Gr��'�-坙2��-g��,��qL2�HQ�Ė�zq;���Y�|�~�j�I��
����]����Տ�`�+��v���Jq��p��,&��k15�9�X�N�A�MJr��x������e{C�"�vI��f��gC')+��`�$��Eo�����V块9�ђ�	6LKP�.�a?�<Z���$���#�i�)6���aw���L�׿A��j�VV�5��w+��=�(�[Q7��n�`��r�d��ߥUT�`δ�z1H�B�N�a0P����!F�7Ŏ���2�zp|��4*l��n�90�Y�&е[��`3q�ƛ��*��$�Λ%����Ǔ���w1��]H�mf�NM&9���lf!̮!�s���Osl������@A/zל���smJ�Ϭ������'�yv�ٚ�e���J�1��YsP�g�ʙ8�����>%�^�<Y����(9]�E`���ȧ�O��<��u��Dv������&!LM��5�Ci;����G}�~�f/�b�2��dF	�/��.��wl*y�7�
$/Δ��v�0HF���%������m �@6á	�x�����v&��>Q���j:��ɀS�[ي�diS_Y�;���`J*�/6��R0���U��������gε�O�4v>0XL�r���z2��3EIz��.��3�]��K{(Lp�E��Ǚ!�frh�PXE��M�$y�nb5�)l�~޴#q�Ov�s0q�)
PMux�
ZdG���R�������EM��M���X`�
�ji6^-��[�ܒ����xq9/C��L?�E���������I����Ц>5%��7�������,^z�M�7��� ̳�����0�8|/�t��O֬D��I��k��f%5�b���v��f%-:�W���Ad�� �1���P^5�$?Y��٨VL
�a��b��t���|QH����b}:�>�;)X]�-� o�Լa=$�O����    k�{K��p��$(����{�+L��=ǉ�@�T��Щ�����z.��'6�]�PBl�HwT���Cj۵�A2����:&̵wg���);�B2PЫ�C����N$h���(��x��'0{s~�ױ�Z5W�<�Qp̛Z�Y� ]��*�d �iiC.�CVH�n���LIT��$�n%O60�xK��)�'���\�K�!(`�D��ʆ&�H���ښ���L[�M�M�����i=)�����6�*��;ۓ�����3B���!,w*Ͱ[*��;I��=��� �e��d��Ê�#�6�T\�XE01��(=�vO�e�9���̵ٕb�I�g��`�A/5ZɎ~j�9�Y��©L��WD`@o�>{C��g#Y�y�9}��gD�����"����fd���ߌ?�E�1�Ж���@��M���%���U�>�,OFD���~n��k� P2��$�	!|�`0P��D�(}`$��[2�}�Hf��{.�(Ό8+x��_��H�3�03�0,�y�>Rn�I�=��ՠ����`��|T�,A�D���6�B�ę�cwQ�f3=�jpm��Ys�AS=���.��������V�zo�$�f��(�'���+u���1	�u�39��Δ��MsWՠ��k` ^9��We���\)�����*�\���3K�I2��11�dV�]}�a)�QC�_��|�®�o6�`��M�^K�\��V���4k��^�80�����jZ+6}���ϳ���;���(������A�M!E���ߧ���},5���F�s�0P �0;m��;7e�K��!�d�h��uC9��zQH3���Ι�CAo8	�Ao�p�8;�&$�m�Q-�-���
$7We9�7���4�A����K_��6�W���i�UzgF��z���� ��ln����"��iU_6����` �A}$}�w��Ya3H:X;�M�7�ө��l�J�N�;<+����w��;�� �`�6�3��M<�3뜡T�.�ww ��dzf~����]Տ
��Bҭg L2�c�zg�����C-��|�%����3:�'���X2}=-�,>��=��X��ckʮ Z�g�!PI�=�`���"Wjb�K�I[�$,��T����0]�Z{}3�"��l�ϱ�|�kԺ�\*��_^�o��(�#��tN-f�M9��>N�a��vAL2P�˜Z�{S�H���+��By���F6H�K��b0P��ex���?����{�Q��&5���t�p�F�����c��b^n[�-I��3�` �)�|Ӈ����p�x"y1��J���UJ7eC(�\��΀��=��@S�]
��w^Z�� ̕��ǠO�i��ZL>��?Q�t�0�f���6�yI����%K��ހw�a+��6���g��m� �`�4�4�Ͱ�x+���oGeQ�����)|��󦵛B�dv��̛���L~7�C0��+ː�9$!�d �ʳl���E`�>��^K�śɷ׏�`�	K?<~`�}��m&����i� �@޴��j*�ݥEa�{�&	q`��\5��#=Q�,������U
���Tk4,[eG�)$��i;�Z`����`ܽ%�$+`0Cq膡�oq%]��ę�������"8&��d2�������zqf��������l��i$yS�͓�s�%D���xS�R�Vߤժ��HOV��`X);�ޒs��.=�����ѷ��taZ��vJ�%`v�M8����o�1�.��I���j���y���A0��4�[`2�T��`6�B�O���o蠑_�Ź����7q�o>��l&6JΔ��:��L�ͻ&�Ph3�K$̉z^!�|hyt1������eГ򡕒���e�)+`0���4L��7iC,�g��?``�XX�yvI����hj5��dP��0��~��>���j:��D�N�A��i�e(�~W%c(�_ϼ,r	�4r���SO��Vx7)�d�c�䞸u޺)��s�lP�@�S��/��x���` ��f��n�|(�\���ԩ�R)��
�^du�Y<Ő0P��u�{����@`�D��9������bﳶ'ow(yZ`��u��Aճ�~����8<��ĀG�]]<l��m ȀG*�$S���;�ݟo��F�K}���C�)]ɰ��1
#D�&������l��S����!�*��L��&�WHTSOI�V�	�N�d��7fl�`3ǳ�<z�I+9�wC��>��]���jZg�� ���C��x&��t��}���<G�8�䭤h`a���Y�U���w�'��f�v.�,0)�fv���_��S1�;@	�@�Yn�09�a0�^���l��%$ț���n7	�@I{��-�ځ�_�v��ěV�l0���]AX@�)$U�����v���'Ī~*�@�w6eYobުC6���1�@C`@ɴ,�`8%�d� <B��:o�rǬV[��	3c��Q	�G�1,�����I"�
LKgy� ��{	�A�8$�d����?��̹�O�]?]���-< ���I;�^2�ܷ�0�3�O�Ά��Y�Q� ޴?)�Ҋ&���a,��6��J俲q�@�3�5$>L�j��yEP0����,z�0����GL*���v�3,����ϳ,�xw�7��OE�̮�3H���O2����@�뫙�,d�>�2j:w|3`_z"����9���ꋇn�'ɜ�:/��0Xj�-L��)&�50���T�&�/
,��Y�`2;cӅ.�71o͕�� �$1*` -Mo(:�$'�d����xFa��]_��M%(`� L�'o��o=����n��6Þ�O
�@L���A2��-g������pUߨ�����M$���f�iX��L��z�z�/&]�'�K5�d�y ��v���~��N�� |q�E��J2z���3�����fB����OQ���6��9�,WM����V�s"���s���0�d�.�� �|�  (����m��[�:_��5�����dJ$0�3ŝ�*�H�w����L�l0��D��`�������)h�9S�̆�]|��kT"�'�^L���%�fT���`0���o*��k`05�i)}�,����"7����P��U�i''T�9�h�L�|�&SS����ˤ�����&5�� b��$FaF_�i��K�e�˓DglzŻ�
�fV�i��m4Q�y�Zl�.�����Lr�6�����b�.�a�S����~ӹj����D�RA�ߎ�8(��˰�(��K)�'�i瘥y����� ~��'�F�I���0X�Imw-q���J�I��ڪ� �m�wK������iSRH��i̚��<�`@�Y��~)��E�`���dX���w1|����d&NC܁9�Z)`0����&#���tm�Cf�H&e�A���$�L̆M���i$��i�d0`"׀K,�I68=�z�~�dw�~����ˬ�\$(���(U&S�`f2��h3�BK�c���f���!��V
O�c��גn���,^��ˆᓛ>�,+>��Y�ld�I��%ӗ���S��mvnB��jHq=�W��P�[s��%�I͹˵"� ��][D`�dP�.��� :O3(`05m%}̣H�j�_Ǔ)��{�a�L��UT�`�9��]��nT.LZ�?�3��d�G�
LKme�לT��"�oWQ��=���'�pPK�ܲ��r;8J�[z� ��O�d���'�$i��>�b��@,���������dW���
��V�A2g*䳙�(c=�]�Ƨ?�p`�8V�@yRFL� a	_j�6�|#�1���D��ezu[�!OF_�\5�����z�ԧ�HA�V)J���� #w�
d2����~拰@���b�ȭ� (�U�I0)Oa��e�������svmY���t��j��K�Q�9v��!��p��б���`3�ӁFM�g�\�!i'G�-��.��1�u���0>e���l�9�C�    9	�����y�P0��W�@6��3�)�p[��w~Rt�]�4g�Ir��̵�h�I�o�����p��3q(�0��d�`�\vE`@5��n(!vҎ��g9��bJ��C���VSk�;L��&�L��fw���a@�R]�Rn�IK�Z"0�;צ��I��n��O�����@6��пs.�e�h���1�7�V�k0���e�a0�9Oú+���f2��-�������d������<0%�<	�`&3r2�dO��.�6=��	�����fV,�<�`.��`�4��_Zw`��^$Ȁ�ߟ���r��^ r�"�����׻vNrs�8�&<I#er���+` ������ߣgeƈ�0�T<��up��T�l��B�����!�d�/���U٩񎱏58=Iٓr%�d����A`0��Z6l3���LZ�?�Sfb6�h�ʃX Ǟ�B��L���L3M�O6wf��O�{�
�9���a��l��������d��<���t��?��ii��N�)�0��VJ�����=;9�+�/�w�g��R�r��;C,;�S2����H&g�ˮ+,O6�K`��}]��x�0yR
��� LM��튖�Lp�8���,]���'M�j�k7����w�0�dz�����x׀!�f����s&�����/ㅚ�����I�w/�Z�	��;��������&�����0��x���-SQ� ��])s�%�m�}��w9Ћ��'U�ړƇ?q��-�U���[HOL筂'�;�zZ��D���L2����db	I!�d|�y�S�?����x/<_�p�e%�=��%���a0��|<�z�����2����#��Ywꚿ=P�J�Kjz���S�������G�-`v��0��fY��Lt�I�y�ʾ�m��s�W��+F�ksvf-
Ol��v�dr����` ����σ���;a��`j�uD�k�ӓ��Rq�`3��ݮ����Ol����j
��T��LO���ހC���yj.�Os8�/�B�]���@j
��p8o�}�D+���~�b�������$C���f�Fř�x������M!��0�w�u�ݫ?IaWz]��х��	b0��rS���F���A̛d��A2��ƙP��E��S�dX��)K�05���];:^ߪD���d�L܊}C����J������\X�&Ȁ#M��z&�A!̵�%�`pm�%�C.�L�eHɗ�R�sb�>)!b�����.\Ų��i�1`R��Q�`@n�f�7��^SR�`6�eq5����`Ao0/��$/g�` N[~� ���׵���� �O>��k�V���`0���E���|mf�y�Ov�Rjɰr�nGnQ�@�tݗޛ���m�wBx1��afg6��$��,��A2�B����l��Q��.�B(�Ŵ�=8(���50�c��s��ϱ�j�IљƊ���I����������9V�`��c؟d�o4�0�/����c�Z��&+��fD\�J�sv��,�ru�];���0�3�:0~�pW2���|
��D���?�[)`0.��3�d���6S]7p>O�~��\Z�O����f(�sr.]����{��76�p��	��4�3�y���
�`Ao�a(����6�!�fV���ל�}���^�0	�K��Ad���S�>S�l����1x�c��8s�k�n*��g�'/�l�U��y�"f3��\� ��}g��f�+���D>��{ƨ�j�>\�Q~�A`0��%���d�����������˿��Ǘԫ�7(�O�w����O�ے]Ml���B0�d����ޏ�I3I�$c�d0�.mÔ�v��]ֹ���_}1��
PM;�'�͔T~63z�O&�/����8������Kٽ���k��n�I�i�H0�h^T�@�$���Y�CQT��l�;�cl��2r�a0זҫ&�{���|���H���M���=��L��d0���@0�k�>� ����5=9����ԫhF�zf3#�h0�mi��`0�K�Z`v�8��;Q�g)7�.w�If*��=���$�`3�ż��`�T#9C��ۡq����w=L܉�L���Л�!H�M������`�i�-��������>��'��uz����ܓMu'�7g�\�#��W�@Ө�A.��/�4��<Y)j��קI"�+` 5�xb��T
(䵸�����AK��j�IA%̀K�{e������[{��['���\n����6�{j�j��ì���4����΂�Uӈ�=i��
#Դ뇛 HMݝ�j������f�������c��"�v&��Z��&�d���We����'���˓}jO�?W��&zwl�` -W���o�@�4(L��F�40�Ɍ(�{�L�tմQ�xqA���n�G�ٽ��¥��K��h�5���09�����;1E̖�]�r��eY��R�&ms�%�>i'�=��`6�z6ę�]�Qř�V�� S��C`0מ�Z6��������}�'8ùc� ���##0�dbu^�R$�.��$y�L1$�dv>��	����ܺ�oJ�M�ڳT��.����33�'Ao���>����L��PϤ3(���MˇdX+b�廠���jٓD���Q0��� RӢFE�Pr��k$E��Jz��Ȼ��f�0߬���a����+M L2엡���r�!̀�'Ò��Y�v)Ð�������ɓ�v�I�h�ɿ�����f�c`0��4���%Zp�f�g�/�XΣ7
�`�=�`���^���6Ǔ�j-��0�I"��ʳ�x���[ �s�c��B��M9R�A��6�|�>��FE�]ArQ��'0�'`J������Q^�ϐw��>Δ��W�йf3�_�]u֬��˽��������!C��8S�}�c���\���
�Abކid�.-�y���L&wo�m*9Gw��~r"�V�a�J\p�}��+K�'��s0�+�ۇ�`�
b�����@<�IL2�7M�)`$JQ�`6��8������M��S_Al��#���,_^l��h��D��l������0�v��-C0��b���(��)}%0q�o�%������d��f���oAc�0�P�`�%�W0LK��q}�"�s��R���,ɀ����N:o��ox�ż>k���=���63�T�UD�͐�-�c0�g������mn!̀����\N�@q&x� �|����#]���,��-���@]?=C�JIțB������m?�ř�i���UZ�<;pw٠����l���,[������szm�Le����o��MF:w�g{�ҭ  �`�T�h� S��f��������L����o
s�>�����������lY��̕�ܛD����S��Pi)r���2��=sK1Q���dr��ʋ�&��L�]}7ŁIQ4��<;V7�>��7���=Y΋����;K��c@f2�Ӛ�Tnȃ`0-���~�v��8�%�bȒ�T����>�u~�L��B�|��`0^�JN:�$����c�7�)�_�EX gJ��bL��B,��&�X8���&_ݛ�3qC_ː�;!M)%JOڷ4|m���r%S�7j����|Ct�F��ʃ,0�9(`�(áOLN�;>��M�'�V�+�_d�ٟ�qLM��$s^�b�}�Ɉ�E�&,0�����)��X��P5L���E�\y���U��#p<gE�I��4����˄À�=f��t����s�N���@��b�ڑ���/��Ā�o�l����3��4l��g����)��!��tg �f�
d�L)w����)�Y���v��zʩfzSv5��M�<]���$�u����T�`��$'�g�]?|�R�Yj��=FC	�����`Z�=L��n4A0���"�4Hf�g��Ų��͔Ђa9� s�(LK%�eX�IBQ���H�OL?�)y�7�L�q    �z����Tj���L�\����x.*R�`Z�y2��:���IBi���]W��I���ŕ;�D1�����_y��E��N�\�F2��H�ː������L���=�<������'+3R2���9/A
�`$x���)*`0����d�"��!��5'�rAn������C6�3�~[���h��1�`$R�`63f�o��[����V�5e����O.0��V��������.OS�%J�✻��$�8v���C�Y0Ϯ%�a����
P����{��j�L����lX%*; ��s�ޛ�|�4�Lˉ�L �!)L&�\�q�~g���K���$�L��o)�9��\��I�ר1��V�!(����a�H��1LM�װ�)�'�L-�2��ew�����1�t�0~7p�dR�o&([���q��o�A`@��P�jڭ�=I����f�%p�H��z�����-u�M������"�iu��d���./wϠ-~sAu�dش9ӥ
ȵ{\Q]΄���L}��{�{�.�,�kR�`��� 
�yz�ߜiZ`vf�
�@1�K���pW������VD���y�O���9�0�d/�!�pW��R����	�Y���U�V-l�R!��OZ�I79\o��0��n�@0�d��Q}/��t��!�fƹtC��n���<{��0���$���U�>5y*�i�������5�k���Ω@0�7��&�w�0��20��!Ѐ�V��fRr*�`qf�I����$w=otvO�l��y}:�]�ݭ��棳3��� #��r�z"�����J=yӌ�v�d��{<�m&q2�tεd�d o������s�'��󣭦�F3T�g4�.��\�Olf�b�`39��� ��i�fh(�c�gVM^_ϐ�n�s[�oZ.Q3�i'�;���`jZnͤ7�p���@jZi��t�N�0=�\��4������`qf���ju`$䠀����_��UH�kUVaJO^�?̬���ߥ���-�];l���^�9�/:����5Lt�*�ZC拓�^�M���P�Ƌ8��a�3R��zC0���\�z׎��g��&9aOû��Ŀ�D��jC����w*�%�Z�����9K6�H���i��O�ę%%�m&9�(�`�t���PB$W�q/��-�eX�I����P �񻰎��Kp̱}"��g���џ�ѹa������𤀁|�g�_+�aR�#�;�>z3��I�~j�G︆�ye���L,
̱+���N�����M�bl�(�9}-&̀W����]ѵ�1h<Q�y�yv��
ț��Z��ҋ
țh�*��&�R�g3�C��	L��P��,܅	%��V�����aŐ0��lQ�pK���RB�P7lc0Kа`&S����F[�`���2�x��`��L���1�p�&)1̙�$�����]��y��DM���iʻm�V!̙6���C8����-��'Ug�)fv��X��)$�0��!�@�d�=�o������d=$L֏���+wy<���Mj
+�h��):���8R�� ~H���Ds�s��>�H�
R�@j���7��[���<��"i��F1��ݸ����d=:����$.%'
L0�S�g&��8e�.��\��|W%~��%��ת�X�sy(���ir4};��d���B^��z��^!̀Smb�j�R���C*}�'�y�ժ�]��8���^�Y���{�-��$}b��5��8��>��<���9$CTn�@a�\��ޝ�0��k�K�q�M`
���r��͚,0��s!f�j��N��zL2���K�6����C�{�M�}1�y��nr���^2���@
L2��a�x�ø���ړ��W"2H�v5�
HM�	�h�L<���z�O\;���/Wo�T�w�@ȴ��'�U����8|�$c,Pi�3L
��"�
��|^�5�o�Y2��Ic�%��w�xh�5%C�$�(`���[0��0̕f�?�a(�u��F�O��v`�R ��a@0�_��9�>�Q:c����ܓ+��Y�T�j:0��I&����.\� }<)K�-,��a�̷좨,���B0�_�R�v�����sp����I�W΅�l�9�l�0��Z��	>�cK�O^F
e��z�	�����3�з���

�f��JZ�v�&?�#�'u�x7��f�s�/@`0?��)��bL2P���$�88ѭ���rO[�A���aΜ
�0���/Rӎܑ.L�oޟ��H�D�����:�[����}R�3�	WL����`�������wBpq�d NFX�.;��g���r�l�a��P�1"SӒY��)��Q#ț����v</��,X���R68�9n��3�'���PÊ�r&���Rl�P��\介��췦�u��KtgM�x1�3�6�݃5�������BoY`�}�
�MF��3m���� (�ֶ�7���s�������b��7���܃�&�q���0�mRI�y��a�*�4y� ,���M_@��;�=����7�37�O�����;����5�����������'0,6�����I��O����L;�,��I�%(̴2�a	��ww	��<�5��A0�_��˓��Zw�`�����Դ�N��{� c��w$��@�eWyQ�%�d�K#��=��{hs�7系w�P@0�t�� HM�wo��mh��:��ߞ���5p=E�oL��dXA˔��=�P�l��F��rp|�/��p59��?����v���>��/~7�A0��*œF~�!�@�`� S���Ѩ	�y#�\�Tʝt�X g�Y�����w��:y�'afp'���ng �`Z�E�LeWVww}�������Gv��S�W͌��"��i�a�f�NG�����c`���B0�ͬNT0�&�
yӵ"��[2����nx#��̠��2Iܓ��6KO_��U0��R���q!ߥE��.��3�H���d Ǟ�����s�߭���&e�ƥ`"�;[
�`��^b4���8J��b��5J�|iԺ�%��$̗��&���o�0��70+�%�tOz!0�/-_�aY��E��"&Ò��rG!ȱW��>��I�x����Ɠ��
7������_SS��7L��p�j�Cav������<QSt;�V������Zn����FP/ o�����D�]���хޛS�xGw����\Oz-y��H�R�^�L�lU(W2I��O`����7L��!�`�<�(=��|�vt-�'נE���lpfؿ�����䝛�]��px`R��`���N��0�Kq���`0�k��Pf���e�����n<y(�8z�{��D�m�](�8C[K�;&(�l�]�a�Q�&�y=�����6�1���IR��G1�0�7U�U0%]�F`@�,��2݃���D��JQ$ׇ3�i��wYR�ꓫ�#�� ��VL��X�O�y^�6��ea��.!>o�]��'q�j�/[m�����J���L��P�s�J�a0�>�=&�k����($=Zy"p(��iT��"�vE^�8����2�k6����P	��`�8�GCA�[��3`�V74qG����W��j�:`~�b0�d��Q�b�g0̗��Q�&cځ%�0X�2�2��.��uWL2�/��ޠ�\�F�p��703L�����`�4+U����)��P�����z��2���������JN��&���d����ڛ%ۙ�j��w02� x�R/l�?�u~��������{��䒶�F6`<�w!̵5��8��zS2H�S.�d����QS�c�5�w��H|J{��*pޥ�E2��d�iz9'�UK�ĵKY7qF͑SS՜wa3%X0��sЅɐ��q �`&���a���o㜞�.���=O�^p�dV�׹����Gw>�1Jro`�\89�p�` �ɮ�.`��H(�dO9�{[Ұ}�!ȵs������    ��3��{MO*��D�L��a����5���|6�`6Cy��h�-0�kk����~W� ��v��eϓ��#�Ɠ�)��݅k�V�G2M�'8�"����b��jb��y:�Ol��6��z���U�Zm��'wQ��	{�� �I&��/�$��zK���X��}*#$0�V��Sa�i�A2�kS��ߤ0��4�D��\����."03�+�`0oj�f�%��G����7I�gK��\{4��z�)Z�fsmV�Jo@�����d�sl�7,�D�2_�s]��r��PI�8��W(����Y�2�h������I��A0P����űNa�Hrl�].������ڌ��žWq����I��7�=2��c�F�`0���R�f�q7�@,�䢟,�u��7|�����y#�\ ��R���Y�+rLKi�v�L�pZ�lv�8W(�~?��Y�د�8���d���W�\��,�7 TS�/X���+&(�J-�߰�ih̳g-�M��|8Ӏ��4ד6EV��_�h�n���8�Ռ�Wr0�@j*�9�q�I�d��Vy��d*�U��,���?�̼����ɮ%�|�^LE;��$���L�!-�0�dƲ�U�=�yv�^،��\�O�%ҟ�GW*���)�y�"՜ƓWKR�\͙Ia� ^�a�4Y���6��\�$ż*��̾uf����cvt��x2�@�]��`�	.�9�Uk�'�S�u��x���Ѐ�\j
~o$���iTa"�ɬܓ#�ͯ�.Ԕ���0�d��^���8�v���5eu&o���AK�.J�@^N��@�ݨ�j��{����hڴ�'K�MKF�0��2z���/��~��"�f�K�"H�s���\�:�/��o	�@�ݝ~��;�Q<5������xd�3Q�����@jꡈ��v́Nq��`��c�?֤0{j$ySOçt����`���ŕb��(�ϙ�N=����d��ڨ|��0̙j��n2���9S�b���o�-��L����J��p�#��f��`�:S,��~��z|��/�vJ�O�	�@jA��{v���T��?�f����f��6��G�c^������)�V�1/q೾�`��l�W{)������I�!�녚J�g�����y������G22�<�Fon�+����9	<�5O"��>��~�9�=Rx�@�N���M9�r�ՏEo7���tC�T�&� �"������gf�����̦�$E��\�h�>ՙ0�k��.XH��L���W�f��"7��?�����m�u�T/`���`�ݚ��E��;;��4�vNv�]�}<G�o&��UǍ��7�r���]>��9�	�@6��&��P�S/Mo�ɮ��}\Tz$򻊦��k/�b�JB(/�jb�d
�`6S"y{����N̛*���֘0X�[j2��Qr�i���� ��L-<��9
� 6����]p�P��Ԕ�_�ƀI��%�>���Uv�=؅d�i��%�|��#d�3�#��*���L��4R���h2U�T{Җ���EL2H���֜�af���G2�ɓ��fv��f�`o�A�v��V�Ps�9e�<��ږ�W�I���f�g��	��Dvo*^S=`05��}��� b���o%_,����̾�/����_,\��4���z�0�|oc0���U=^2�0�����d(
3�����-tN���+��ڤ���E����` 5�4B
0�E2�k�<z�������;���@�hz�N�9�:!�~���de	��hID��V���Ң���߰-�LS׾�L�]:�$�yv[9]���g�0̳G-��~�&�c��ړ�_9L�W0{�1�IF���.Դ�=�$}_�ImӐn�&�v8L,�<)�c�����;�I���CpF��7���x_�]j��Cz�d0��=O��������V�ra3����+���Lg�~
�mqNLM#�u��L�Q �J\.���|K��}jkO�~�|�_a���.���[��T��Ԕ�76S";���t��>f���&�m�`�8�'�{�!��M)��f�(	�y���`�)�#�`�s|���V)0)��&,��Y�ݳC��˩��ـ���1_��~4�0����Å���o���Ԕ]i�F�'�
���n��h!��A��3L	�jB`0��" �g�ʓj4�۽)j1�>��_q<I�Z#�8���d��\;s��&P��jc0��h��v�ц�p�����խ��!�����:��;8��g,;�E�V�^H&k�$�Ksx����j�GM�BxR@�Uz��)Q~7�LK䨐�`!>�!�פ-��ٱ�,��L�R(�n2��x��(��D<�n^���1���-��`�Oa���`Τv��Lt�|$�dx.�,t�@,�cא�\4/�#ك̞(�9����9R���Zj=_tى������E��\��_�����ya�R��o��{�L�,{-�������S�zr�@����){���E�&�vy��N������7��7�
��lF�o]���1��}j	O�$�h�^ ��Τ�����fr����=/�I��u.����ɳ�	�`6�&_����ȿ6��j�~CaX`�� O.�mF�3�3/m瞬-ʾ�"0�N��` ���]����E2�7I�zq�g_?;[�(%�������翆t��ɭ{����7���$C��&�E0��rv[��,0��<�<�E�I��)$,�45���MD�R=�70=��%�2,�������7`��m`�k>9,X�̋��ٟ��K�']S)���LM5�\���*� ��R��v@`@����X\:�]��2=��O����Z0P�,+��5`.j��z^U�2e�z�gb����Iǀ�k��b^u��v��9��	�< ��@�[�?�a
��z��f��O��ρ8H0�/Uj�.Lf���|�f����0'w!�¹V���Z�Ht��\j�$��I����${�A2`�i.^Zğ�����TKC�ɞ��89��6���N���-E[`0�Y|��-�r�LsA.֣�+g%�Kkv5����7���5�TB�0�{<��ԔS�h�J
�d�F�i*��9w �`6S��X�.����6��o��֖/0Z奣�ҧ<��Z�.^�v	r�C LMc�o*��!JT�����ǹ�{
��M�3���xWآ&(�u_�����N9�t<y}'�}��B2��SB 0��t�~օdb�� �ySO�����~���l���k60��wCb�엚}d��&��A>9�֙탁�B� ��L�
��d$��!؋�񍚚�0��Âf�����B1zf3C��i��.YX��7|l7����2��y#P*01�ق�` ���F0Rb4�@&3��x!��T0�g�����&��-x4`^��a�����P|t�gH/�B2��ل�`0o�*�Ƶ��N)�`0�,5]���&���y�@a��s� ��M3�ua�!g:��g���R�F�/`�~�/L��Ɠ
x2gg����9x �@<Ek�zÿ�U (�̩�]2����S�3yg暩]��=Q� �i�ޒݵ����ii�/$����=�mr�S:äV�͖�J��7Er�[`0��}&�����W�;O/�i	Q��(��0�`��Zv�a�n(L�1?��`�[�
�����y�^�;S
9ZX0�Yk\��)�|�+B0�c��E7!/���_rN&�����aTI���hIYV�HLI��D��Rg��=�R�A�\n����?°�o�A���.LFv9��h����V��S��..�T
̀���Cvt�Qb0��f�y!����֛�7g� ����0�k�^/�L��J�A2��x�]H&�z`Ԕ�x1g�|X�Oə��%����0���7��|T�'&�� w��]6�,��dH������Ű���bJ�d��t�����|�������0��t���2�D���}Vq    /�P�!�H&;w2����'i2�\{��a�.�c0���R.����Ec0P�IZ�g&�p�1(g��G����4v�*Gz"����b��O��`0�m+^lhsp�;�`@���fѕC���d0gZ��d�`�/�Q'�X�C�h���g�n�|�NDQy�=�l��Na0�Ǵ��C�f�Q�z���~��"(�E��]�LѾ��3{���|��3�a���'5!0���6�f�1H3������x�A,<���Y��磓TS_�b�Kb���$�yӌQ.$�\<�E���_D`m&�w$��ڛ��
��z��t�_��S?YN���3�e��c�M�	_��E`��fz,;Q��[�À63b�X)*Q�� (7��ua�9�KV�}�'6�]���K.�,� 0����φ�a(�.�C��\;��oX�S�@0���-�L	��2�m��O6n)kp�<^�7��G�`05q��1Ee�bE�"̛d�����dVs�O�T�2�@W���w�����h�3�O�	�`Zj��^��췯,���w�l~Yaԯ���(��֓���4R_Hf����~���/�
�V;�)ol���t��{@����)�!�"��0XΦ�d^8���� �f2�(�Mƻx���'p�/���[>\�hlaf3�}���/�ɀ�������d����j�*�I �>j��<��Lf�`05��n$C���M4j�'jb�F����� �I�����C��@&�A�E�Ԏ)|W����՞4ڬ}��Lq�{�����J�tC��	��r6S�ծ&�Ϥz��3�76Sj�HM{61�a�I��u������3��oʙ�ٟuWn��Cq<���*�ݨ��$�` �H���U(^�Ɓ���ŠN���E E�9T�`���=OF�_�`�r铕"��.*�R<]�I�����c�� JR3�zS�$��3�ɉ���9�SuJ���~�w�p:m?��������y;`0��ů�*�,!0�ͬl�֤0��
$E���9���)~�{�����E��S^� ���
vN��|`��/�>S�i�Uab:��B0��j���S�XL�G{��^��"�������e�1.��f33�`O�]>��!LM+�.`(��qJ�Յ2/$#��p�L5ko���ӯ������b����rwL�����D2���V9�d`�|�jҾ�L99�3ejs9�})�w���T�77��)]�0�ϗ�&O:����`�n=��oZ!ك9Og���P��mQ�������@&Ӹ�؝I��o5������d�R�=�P
ɳ2খU.$��;�f�����Y(jU��Ia��n.X(���`&3C�؄#9'�[�=�����Ô��`f}3�w�b5�
�I�{К�.�[d�d�}��r#�,0��������!�z޷�0��Q&�ufzsG���:{�T�)[�YM}b�%W��R�\G`@���]t)���11,��.g�X���!����*}_,����!�����v�w��o3c}�$�_����a�@J��E���ei����$�R/XR>��!�b���m&	B�d LK��@R	�I{������կ���/�j-���^rԑ��7c��UI���{7����K��f��R%����.���1<�'63���pqO����d�v��.�L��_,P̛��z!/�י�d4Ñ�MF#��r��ZtZ����R��W�3�S<��,�_oҢ��\�������3��ũ����9s �`&3��X)%�o� �����k=N��-��	ys�rO��峷���0>�S@@0��V��Z�l����r�ô�l����h3q���胷�	JM�T��I,g�`%.�ƀ�U�����q"������ԛ� �����.��5�%��u�ya3jl�ЛF���fJv����Ӳ���6Nb��Ν�1Ā��lرa|��NY�Oz�i���{��{?�/���5ue���}s� �|ٕa^��,�
` �fWWg�/y	9�3��I.|I�i0ı٧���dB�gH'�x�ր}�B�d��|�#��x�7�f������`0�4E��)���@sm?����Οd�I�y�����^�`fOO��9�ԣ\�ȯ� ,�g���]��P��I�:�?�'�b���w���L&g�&��S��@a&�b&R�_o��`6�3��a_�`3X�	���G����ɹ7��V�6S�-�`@�׋ݛ���;5�I3�1�wJ7����&ȵ����Ә翕N��'��9�j�v2�M8���<���%������X0g����Z�r�2S�R��%;勿�fzr���l}�b���ݓ�X@�Y.��ӷ7�	���'{b���0��$O�
���0WJ;tٓ�X�ݴկ���z"Z�beQ�1�.*��鍟8v/�Y�r�r�T�����C���<;U��³�Dg�x�Xvg"/�t�ř�d�4�]��Z��S�!0�dV�_��h��
��s���(���~�!��N)�@e؃��N6�` 5���7j�������E�B�s�8�MY�^��Pq�A/��/�v���qF#e�nWq޷@�,tR\|����1�/QRɽxi����6���w"��=y�I�*0%��!PM���/`ʹ���`\]�X��	zgH��x�q��~Gݮ%	"�Q�N�=�hJ��R�.���^��0�Y�`�\�O`��T/`ԛ�R�&��<)\�d����d��:�0X ��dϓ��f�FܓMd��ƀ�w!$�3<E��f4������&5i��[�E��S[!0����f�����듭~�+8{Q8�c�(�T��V�%$��d�ў'�Ff���en��>ҩr�`���d�H����0ǭ!(�H[�}7�~�h��\I?'_���A3��ymQa��� ��u�;��a(ĳ4#��<�L��˅+�7'��I�yr Y���S����q"�L�Y/�ZJ>&�@�T�ۏ�+LI.�گ,�:��^��}wj/� k�<�#����7m0��V��L��Am��R���E�Y���9S��"���*G4�@�T��3���9��Y��'��z�'/A�3A0�3�<���_͑����U�'�]��i3��s=�������̈́}Z��u�p}rj�6�.ZI9G  LM}?c�ُT����v�h��l�.�s2�y���Q&p�g����Ǔ��i��������`Zj)�a�L����բ�O�arӒD��7�H�UK}�1߶g%��8o�M���_G��N�I
�M�pj��~!�f
g/�b �/傶��0�g������Ll3�%�mҶ�<���=��\�?�!�/��D29�ew��B�OM=��^�:P��C����� pߛ��<�TK����'�XI�~@ 0X �L�0���A�΋�<]Ž֙.��<F��Z�����]Y인=�d�Spa2��7�մw{e�8��}L2���k�R��#��@0P���\8�&&N(����E����j���42��ɮ��]3�A�6�F��A2��T&�ی��J����'/��hZ��:�PK=܄ml�ٲ��1�>�@a��N_ ��'���\/��rI|j�鲼i�f,��δ�九��`63SI�^�$�EWH2��rn��4����/1(�LJ�bo���a���03K�76��~�'��]�Y�����2��
����/lf����=�����"O�~20`0���d{�G�MZż�r�X[$�G�f�d���������+h?�����W�6��߁` �Y*�Ζ�f�d� �Xn,��YX�P0�N�b8�Q�8h�Z�_tL�U���Ղ���f�)�Y�I��I��/�Y���l�A�W��۫�}��[$����<ʲ'%m��W���SG^����s�J\R�â��xq�L\�r��$9�r�M�N��$Y]0`g7F���',����_�XP�,��=��q�$��-��(��@���l�BK��[�e�����|6     ̳}��b��P<G��^z/�Uɞ3~�,S��W�c0��F���į��`05G�<e&�qΥ�����]����,�` �	1�_�Wr�����X�Mw�\Z)L�tl���^�ѷ`��[4LM���u��0�L0��8�Rtؓ���v�Z �a��[�����M���vb����h��s�����Щ���f����C�"�If͞�ٗ%�0��D7rt0�A0P �{���W�h	�y���Z���i8�R˛v2���\��`,0�3�^�\HF�9����;X��S�;$�f���v5��;"qi��b��$I�L�ߓH����\�)����L
���T�8�Ҫr����ɓf3��9/`1�`6C䆻�)����6ñ�xSN�2=&( '+��<-���@�:��5��?���I�9��`��[�( Bq�y25������"��r�#C,����_'�n��y+�.`8�d��L&G�v��1����O�=1���4��ɘ\���`�0�sr�	d�Y}�"�F�m�]~����'+ҹd��H��p���B2���.�����>��h�>�V�J�O��<�^�ZYE"smr��̞N��Vy.���}��ƵS�s������L�B2����P�ܞ,���/`�~�h��Դo�]��7�����Qf�Ǚ�r<j�]|� �)��Y��oT�I&�*70{�=��f� 쮝yb�`�?���٢����7�eO{�[���`o��q�^�ٗ�����}B�~�UaB	g����I���q���W2 (u��L���E2��H��o`�L��`�t�ۼ������r�/�'ޤM����$g�]Z���Xݩ`0o�'�/��y���l��u�<CZ8|/	@0�k�ؓ���Sψ�E����+L�����3�r�/��W-E���i{`7`�!�%i�cѓS�_�T���9VT�O�5i��N.`vn��\�D�50�X�b=������t�%�s��0�z�)Xj���3�ԙ���&+����U����E�$���2|������A2�7U-ȫݛ$wv����OFdH��O{Г��YӃ` o�~ŋ�@R���p�_s$�G������5�hU�t�gW�����8���ػ�)���'K%W.z���p
r�uN�W�tm�D,��,sm��]H��|���v]��k��k�R��d��2�]2Ň�����&�Y.z��%�b������E-V}8&3f�OV^�tq���M߯�h���d嵅6.��K.�+���E��]�B�α2�F1^��	'3���5A�r�>^���`0��teJ�h���I�)_�L��=&��@����Ś��J�a@��ӛ�7���.��-ַQ����2����` ���-��&�a��l��)O�I�^ƅd��H� ����ra�B�Ǝ�`j*qL1���GKF{r��}��β�[`0�4oo�7�ލ�a�0Ӈ���W�����Rߜq�cxw!�H�Q��̔e�8Pz2HT�>�x��D�ܠ�$U�$�0��)g�����3��������I��'k�C\5/�?a�se������W��� &LMS߅dR�u�1\�O���$_�d'g���*���gϓA��sm�Bov�g(�.l��;��M3��8�o9�@&3�a^�h�o�L��v�DG��y�'Oh��K����z �`�[B�2ѓ?�� �z�VJ
!��3ߙ�+�
�
�>�7Af�w�G<��i� H2��/lf�௘���z�M��ø��T`��$c��&	�TVV�,u�{�>W�>����76C3�~C�`�8��M���K8��3�9W�J�a��ƃ\0PfZU<�L�sz��lF����鼳��`qf��.�)S�5��xc�+�E͹[�0�d��2S�2i;׬���^BC����MГt���`5�\����JťIp*��A2��Pt�n3�Qv�A�Lq����OoP\�#�'�i�:{��{	�0�w��L*9�0��.y���&3�/���L���)�7���gw�����`� ��w��c�Uٯ1�g��e���P�Ʉ%�VY� ̙|l���T��
����|�#Hn���`RHO�kk��ڳy��0L2��ž�输3�}��/֊�/���]���0����O.`J�:SӠ��M�w(p�-y1y�x�����d��lf�1�q��]d3!w���a�imX8�g:K��k�`�N�c0�`Z�pR�T�wڵ��'�8`ZBw+]��,���d��=0y�V�1�@a&L����"}��	����p�}�=` o�Z��5N߀�}��
%����L��$��w�Hm\�$�E"�Xѓ�r�X]�v�����r_�=� bs�/`rH�p҆�bxe��̊�^l�*�V�70�N��@ޔT�ݭ��QΒBu�$��u�K`�]��
�J���*A���/�q�"��)��f��zQ����Ms��%ą�f�m�R�P������0{���h���.f�Z�P����0�����/|�?�i��M{΋yKEa�������4�OZ��4���<��N��f3�Q*�ä�[g��_�.�p����ܘ�`@���`X�A2X�˝�\��}
G2u���sW&v��,�澤�'޴r��Sܙ7��@�!��6L��k#0�͐�1�#�w�)!̵����zFa���W���D�I�#Β/`R</b0P�!I����=` o��a�g|N1Y`0��q;Lq�;#]�G.�ĀW���f�df��F�v5iI�C4�@6áoO����8��j@oJ�����B��ۄ���ɩ�5�t�l*�\�O�[&���f5�ڬ!��A/h�#�?RS��!�
#Q��kѓ�"c��)N{Jf3ˍv��E�dmJ��Ck��Js�yOP�O_��~��k�����?Kzf3C�v��64y�M�R��� Ƴ�@�G+�E���`��{���5�}�$���䌩�O�0��w�X@W�w��/��o1���Cq
�镎dz"y�:.��쮤���q̙�#�v�h���`o�J7,�E0�/��E�MZs~ϟa0����]ʅɤ��t�XGz�	�9�y)��\q̙����/`��f@b���ĵ/w���l�7af��Hs���w���J�������~�Ε�8�`Z������&Й���){wfv`����*[M9�xb^�.��믱�6/`��k�`0��͝�dⓚjJ���GW�%���_�>a�������2{8A���T�X���gLř���8�R?�wj����R��i�&r��9/f��K�0yw�4��1�܈��ĿjB` 55?��k+m&��M��-��/l&�� +-T��`�\j����o��dO�ٞ���M�i^$J".'kC0�7U)ӾA"�=�Ҋs���Nk���͔辗T0L2���n3�S��A�6\xsD��뼀)'iC,��v�۳�����L�{G�]	-Aa�gig��\<=\O��'��I�E �6[��Rr��1�\���c<f����^?��o�p����N�I3��|�È�|6�{�:�t*}r��F��&���mF��p��>grOڦ']�C��M��x�o;r�Ş��r�ޖ-#e~2�]�Sn70j�L�I#�E��_��o�`H��ěF���`�9=��`�i���SB�&��ѳwO�Ƣ~q&Nk�_�AX �L�ǵK29���]T�%�xv!(���(�3Sɿp ̗&�rq(������L��$�L��b{�hq��!0�d�R����bf�B�]f��Y0���Њ��,e/�`�03r2��\8���?:�ts�h^��,�ȹ��JT�IRa���_V��?��֖��w\̱W���7G�HS������8��Ғ$��~�y��,��������?�W�U��O2�ju�f6K�g���%����|�� y�:�m�=����o����&S���UN�����X0��^�r��X    � ѷ��1�BK���D` g�.�v�$=�pN C�A�out1�Fa���7U�ÿ�qb6�ž��0%��y�L�}��y��2=�pm��|>r:j�Y�5��=3��M�pЛz��a�uL�d o��&�A��fr���Q�r���6W�=m����挫��e���=;��-,�����83�=�弯W`��_���ɥ�fO��p��5˾=�B2��w.`�e"�عE�v����פ`0��ڪ7�It&d@0�cu�j�ae{�ar�&���Sfk^.����0L0��E1�iＮ�`&CN�_x6ә/�I���>�CaD��l�f(DO��6/0(1Q�F0��(�Q���$�1}mv������ٯ���"��f3q�ث<	ّE2��H�JqгG���f����ԙ���dؽI�R$��hQ��N8~��!̙ص"��O�X` gb_��p��(��d������g��A2�gsu�b���Ng��͐�BM��0�!�?Ns��lc��03���>t��@�Tܰ��M{��|OzC0�7?؜'�Otrvvjs��'1�����O�{� ��l�E��>eÔ3-	���ZJq�m&j�m&k�Jv��x�� oj����h�60V���|���$!���ko듮�k��0Ż�h�L��>s��^)=����jZ�+���N�AMX��yq0t��cj�"�Xҧ��𱙡-�{q����l7`�g�g�QFz����G�eB3� 1�9���\&�sh�A��,�����wq���Ls^��&�W�0� Q�9��]�S��s6G�_��Q-�Z�ݱEK$����/z�����F�F�Ëޠ!7/`�}3�0$�4JA�&��C�kz"�F��H���I��l�]�]�XX�(C*�u!�RΡ[ɒ�$�`��Z�Y`��Dœ�4��1d�,�(>�7�SR�7�-��j�?�����.�JS�y��¤���M���[�0ߜεu�x��j�!���`0���E��L�Ň��ho��d�_�B2α/���]��F+`6H�&�C���v.�M��6L	� 0�Z�6C���d����bCPa�:�WY�6����ڰ�&�}
��\[{�rQY;��D2P5#U�y�-��P�{�M�syqn�I�������1(�?K�'��4����vP��Z+ѵ�z�%�C ,̔��c�Y�;C�1�~K��
�����%�d�ewb���יꜾ<Y�j^�d��7�����{	���~�;f3-r���0�����|��qZ�G�15a����B��xW�E2P�i��F2Y��/ �J��/P���Q��;ߏ�`�=�0��,�z�s�5쏧�ߥ��bf�<�r��O~�۔��d)i6'�}&��/h`���]�+�})�����������P͗06�������f�h�7�@6�ݤP.�Tb"1� �݃�;����/�`��]�Ʉ��,9~� P0u2�s���i����vo=]hI�w��{�}�=��~Ȟ0�c���y������6��N��
!������@A��t�=��'�O��_m�S��/1�b6�C�����@Zbo>ۤ0�7������2���[$E�5��\��~� ����M�w�n^%R9g ,�'v_*.�W���*���!�yS�7�����e���'�÷|��@�;�!���Yj�j�Q4�t;LHN,0�k���Ƴ�㴗���L���&!-MZ�d7��m�B0�3M^d������&(�M�$�R�&%a0�g���x��xq�Ft_+����o*��~3y�пh^��̹ފI�&���
F��l�A*���n3����&ĵ�ˑ���@cQ��é!Z_��S�I2H6>_�DO����`tuO`45Y��o���;��@6�57Y����77c��%)�Yb��G3!�F3L
�}KV#�4���;�8.`�co��<[;�I70��y�����˙�8;��C�Q�δ��}���@���h������XCq/�SFvBծ&v)~�GZs^�٧��L�߱q� rp�!Ɵ��d�9�vQt�'9�EW��}5�ٝI�v��`2P�̉n���sK�A2�3e��^�p�T,���L.ey{9�{��'��5��DM��~���``0�dX8/{ .Dg&�P�Q_��.�T����[��`������
�0e�d o�:s���~5>X$E`�'�n`8����`��1�~�\OG2��P_�u�&0!�oE���Ԝ���7L��TV�4�)��Bޢ&(δ_��D��[L2P:hѻya3���&���
F�S2�	���ָ���s�]+E��In�yo��䨜��m����I^[J1HRS_��&G�o���S3���c8��)'����`j�����o.&&(������%aQfD���䒿��\ ��w���^�((g����Y���c�'�;C"_T3�D:��ز��0��%�fƊݼ���V3�i'��Ƨ�qo^����:��ٽX���i�.`��u�` מ����Ù�񦩵x�^�R�߾����'Z���++e��R�a0���q!���(U�R�.$����H���7��O�󐖊߭��Ϟ)�Y�Z
%��*�Lx�)�f��.`Jf��&��]2I;ۯ���b�M��@r!�k��o���~r$c
�P��S�o����/��)²���j�`X�G��0���9h�M���.`�|�!f3���x�0�������zt� ̼_12�@٠:��^���	q��������&S|8� P0���0�}��d25��� \B�o��&șj�pdw�C�.Nb��RS�S����]�$�JѾR��hq5a��-��;M9��G�g��ɓ#�i^΋B�>��H��
x�~O���wv��$�Y��̆��m5A0�k)�:Ue�p�m� �@Ao�ݳ#��<	I�M��f}Zf�h�����7F����i�y`Z�❼�4O�O��}��|�U��οXYN�kvoʒ�.2���Ye�m&�]1$ά�5���K�R�'�{+�V�=��s�}��{��B/nڽi?��mOB0���[�i�.�7he_S|�M9j vv����0Ȁ�1�ۊa�<�`0��JCb�)�|�&$Q.�̃]���Y�`���i�h7`u�����ř̽��m&�7A����9�f����Ve�*e<	z�7�j�j�d��Դ���x<H	��̤pc��Y`0oZ�X������3k�h�����d0obn��=�ۋ�O��Z,Բ=Q�g��q�d3\|7o�o��l�����lM�0ٝk��W��h�hn{ �޳��@Z*�͘\�| A(X.(���ݕrg�d0U�_�G������j�n>�9kN��]�|NǕ,KV��D��b��|��,��K{��w�`��ⓧ�W��݀���9�*����fI9#o��W�4ګ�d��/�$��UO�w;�>A��\{�a?��a��LkLW/L��'�Lk�aƣ0�E��RSq���.���������݋z�I"�;e�ɓf�~9$�3v�gG����������$�?���j��V�;L
1��f�� 1O?���.`�?���~R�ќ�7�E2H��O�iq�ä�l	d�$y���
��M2�	s�6�yf�_g�(�岻�!��%�v�c�j�I��A`��:v���S���P���}u�쮝����� ��}����s d3��r!��=���꿎��`�d7`R�ǄÀ��[�R�������Aw[���͜�y�Bf��GD���C�I�g��I����ao��0G��6��z�A��Q[fg�I18�`�~� /l&'W͇�7����f39�ua3Im�g���Ԕ�����XՄ��`J0/H��A2P��,3ؽI�C�<�(�H/<�d�n�RV����@�K#�jw&R��d��/R��L�z�V`�����ɮ&�1|��/�g"J�>Ρ�5i 	   �F�� ��i�m.��Q4��������$� `�љ�m	�6�nZ5^��XL0P殁����B6�@I[bt��M�8��׃<)�$Q�v���m�a0o�\�u��!���3�C�v�x�L�=9�4Z�a7`Q�:�a�8SJl��E�d�H�M��9���I��M�ﻲf���{�T�M��l.`|���!�@��1�LA0�kWj�G�=S��L�9�PSu3{{��B/Q0�kWߢ�0R0�`j
/�L�j4,W���B2Zxp1�@�T�b�M���cA�� .X��,�U..=	z����LIG2��j�f�n��D��l����e���a�$f3=$��~�4�X�yS�{���|�π�_1?�L�3��h�_� �LK��'�GB}f�a���2�|�&�s`���(����0���8�%�~�'sչY8&�`� �k�bL�1��2��N&�������E����{q,#��!��D�N6�y//����D6�E�?{��w�*�:�ud ����^���P�>` ��GՋ<ɒ�[+
��N^���:6����Ü.�l���)�}/�F�qPM��pa���a �Ih�a�%��&LMH�1&r�'m�����֠�D2���&x����<o`r��& T���0�kIn�A
�����&�w�S�Bu��N�IN,6���\�"Z^�t0gp/�)�
r!!�3���8�6�B2Z@�z��Դ���;�M1�vQ�/8�M1�9��Nߏ�@XkY2ߠ,\�7U~`����$7%N�<�Ha�ʌ�`ޔda��ᔢA2����x���V^1�@A/��ͧ6���5Aq&՜�S�&�d�_ȳ���;�(�d�� /��)L�t�%�>�̬�&̈��"ȳyh9n7�(��ֲ5�����s��L��Fp�dx9��Q�V�\�T���e7u?:�!�\�#��P/`��"ȕ��*0>K�d W�Ф�fO��	�KR���C":��p��$H�\.��p�a@n��v�0��7��i��'�}���Y�⋓��x	�^���n0,�3�fWS�o2�@\(�dw�=�������-�B�PR���X@�p�xλ�2J�E{�v&rg����[ZY�e�֛�s���Oʪ�Gm��Y��` �iԘ���;�`�Ԙ[��1{�`0����KjIr�\i_��h�X���/�"[�].#���@)r��m]-��s��K<�gӱ���aF"[���s&1�@�;yd۠����՗f�5�5��pd���Up,������_�\�,�͖kr0�!ȵ�f�x����fymr_�i����r	y�
1T�7y-~���M+����'���Gb{ ��,�ߴ/�]���`2H6��{�v-��S�Ŭ(/^�(�5_�d��M�׏`���R^켼9��} 4~�L�� ҋ0��T�ɤ��0P6���V/$C�\��`�0{ӟU;sgb�}х������t����Y�I0Ð#o`�b���������w�=������e�L9���^�vg�T���d05q��BM;Έ��!u��.$�9�Դ]�6���o�+Nϣ��㌭w���_i�`ir&Z��%N�9o���if��]�йS�i	r�I)�-��h�r�YkLjG�:g����w��l���ק`0��������v�0��F	�.Q_�5��4K�(��d���3kʴ`Ѳ#YԄ��[��*��Ǖ��W]���V�w��?��.�y�M)�V���h��N�i��>_�Ԛ���K&$�?��˞f�\iJ�v��6Sb�����#J,/�a�Oj<E.`ʯ� H25ȺP��o��SuQ���z�)4sV��[B@0�7- ������ę������M���"p�(��0��oy������_�}�
�&$Q*�b�v��;��AJ�����F2$�ř��%;LJ��g0$�d7��7����g�f�/<;�2[��I�w9{�m�XϾ5�v��N�[������t.I.`�����Qm��|Oj�0H �~�)
v�����&$���%���G��_jʡ�{�Ma��t�8	�r�Բ�z�S�&d�)�j�)M�K9�mN�z�O`�6���зj�@I2kz�n�ar�d��J}��p����P��0��1i^�?{;5�P�ױ���'0;Z������p���Q������g�o��;�����=���?���O�|��)y��(�w���O��r������S���-���_a|�O�h鐿�/j?O"�?������������      �      x��}ْ�H��3�W��ڤa_R��KU���ecV/XI�H��be�����Ķ�J�fljjI�����Y��(��
�+����4�U��%oˢ��:-�U�������g�/J�_��I������U@����=x��d���l���-��+������m���1^S�＿�W�Go0�����ú�{S�ｶ��OS�޶o̰�k�=��s��>tz�S]�����aO���Mw|���>��Hy�*C�����{ݵ������7S��ߛf���O�����������)�˯͝�����Oӷ��ϓ9�G_b�}�Cן��}��;�1��n���W��=�ަ?ҟ��u��O���wzڲ�/�~0_�^��~�;�W�`K_������O晝����3��]��9z뎾�ñ;�}OQ����~��3��@_���r0%}KowM��kN�F��=���F�x�Ӱ�����r�_��s�4w+��w���Ң������&�L�7I���~e��&N�����O�M�x�A�?��AW��fG��M�����Я����u����Qx���8��p4w���Ɣ~�HlJ?ɪzzl�4��M�z?������uMG�1۾���t��嗮p8wt��Jt7��)B���(�b$I�O�QJ?W���(^�4ǳ18&tzJ�H�R���N�=(=vt�jJ�H��͑�%���iN5�B����E_,��6��ۺpe5M8=`a�F�,Y��(e�q�ʊ��p�Pڦ�K��4PJ��~Ɓ�,���}��r�)kJ�tǻU����>S>=XQ��t��Μ�32�~S>�O�;RD�S�	{�Ǐ��͖ޯ���8��?vo�a�5�鞢��=m��v���|��3�z�ozza��(���U���~fB�H\�����qM��׬����52�l��5

����ƫz:��&��a_�sJ�eI��^�o�u�4w�J��ZI�N�Ti�r��Rf�(RB/��!j9~����c6�������ۣJ�kK�(c��{:��F<��z�m��k�V�w;tM�"�l�`N棇�ק�X�8R��є[*�(�Q��T�Q]��w�LP~�ϸ�U�%?��a[n6w����^��E^O�W����O��9p�<ङ�%*��=����t���� ��rrP?��X���rBSQN��xK)��M7���s�)Y5ݎ��{w�+J�T�wǃ����:�W��R�A���;XEI=�A��O�E��:2��������Cv��u��m#���O��A�G��ոŗ��@�2e0
9�'���Pn)���wMU����0Fq��S��lz*+�H��襔γ���r؉rX�����6�4�i�G�4���SF�R�}I��ٟ�����P��?G'��f��$�4��4c����뎎ӱ�%�q�Fm�����L>�_j���t:�����]�����ٺĴ��v��p���R0OT㬑=w��8�yն3�e�F�>�A�z���E��݁�7��,�:��h%c����QU)��шPa��s�M'ܫ7xv�C�T����Y�T��
ψ_'�h	��+7*����i�p����hh���m�B��Zx��Y~�����&5����#��U�ݟ&zS���9��q҃�wz�O�k�ڱ�n�{m0d���8_߯�X�Anꪝ���bL{��������H�]�Ok��
���C�� ���"KC[��w��i�Ĭ���jjKqZ0�|�S�m?��ģ��<`�}l��i����	��xz3�q�S��_�ϩ����'*�0g���C�ؽ��P���y����g�r!������d6�3�c@��<�a*Tp?�c��T^�k�Tӏd�Ia�<�J�;o�%�����9/���*�.\��S9�u�����ԯ^S��W[c��x,@mTVY��eQ�>��c�s�FQl�(���G�Ev� =�qף���������?���ݱ����<��V�C�o=��G}M����I<�<>-�iT��"�����L�).v_���8�y\ht-j�͆�����O����.�'I<��FiT�g5^�jLC��2tD�,���r�C&]h�}�E�Xז_uć�1��7-C�ԙ���j�:*��$qD�[a7	�@7��l)�Vjo�@֜���9շk�,������e��\$By]�3"���m��'�O�GymzOYh�U'Ja����^��q*��[s��T���W�����xo�Z=�n�-D��E��AK�]&�%U|�_�8â�[�O%O�π�/�ƽ���Rg�+�81�<`o�K��� �À�b'������y����rz�'h8����<*�&+�q��/7�W�-v��t����Tx���{B�"�@�b��@�otA�{�}u����p�g��k�C=t}$}��`\�k�o��Okz��[�?Lg䳡��8,~j����O��F1w���x x����A��^�'P��0��?����|�ᎨY��#��Zq�M�n�y���j��#���@�����{b��	̌��Ǚ[�����~k튢�b�S��պ�:owċ�����^n���:6��$G�?c޺�	�
�c0�n�ͥ�%��Hg �"ɲ�n���ҡ�������yP�������w�#���8�^�b��R}p��{<�3��VE�D����jB?�ܪ�uw�O��p��C�u.�,�;�'�e��}��S�)�� �t��Yk��i�;|=`�,���~�e�́$A���[0��x����̏pI!+u��v����]-�M�K�=m����$�i���#]{[��.:7�٫�Q�6��}�i�E^�v��q�J
.��W����۸)�� ���(q��Ox\����w�F�:��P���;i���|T7E\O
��^���j�'0,���=�-�'m��s.h��i�Eow_��=� ��)W5�A¿0vx�;�X9�g�@�;]���bJ��.�ާ�Hy��;`<6��<h��ǎK��[�-п5��R����T��:a�1�M��ӏ��'\���u���A��=��cO��jwB�Iu"�[����`��N�9xC��i@#KE�á;�����7��V��p�L��d�^�U���N�Q��'�d1?���΂�8Z(�y��v�5 Yk�<��3}�ǲ����,�%%ˍ�{������<���"J~)�y��?_-��U��_ \5�X�y�n����~���G&�����s\[Ͽ���+O}@������ꎌԦ�]����ܝ��c�w�hČ�G�<l�O�%y4����G�Z�M8}8��;z�`���yf����MЫ<��b��1�����ӽ{�^�
�������j�4���d��۱Y�����%��!G��[�ñ���y�x�Q׋��T�K��_�v��~��;c0�1���c��Ǝ�/��	*��v���KS�	�5��>z�������̜/>oP?4y<#�E��v���N�t�/�j�9��p�����5�R����ȴT~_!�o�Fak��3�,����_J1�j����K��ݎw g ����N�>vc0�����y�#��E�HԒ26�QY��o�N_��;�q�5������<2�j3�(r�n����ZRQs�s���@��֒�����Y$\i�;*�"����+!OU/�'�Sˎ%��/�Ŵ8�Ȯq�>���3�y�$���Z�����&�Y������"������l�;��MU1dYz蕁�=נ�q�yu	��0<Ys��k��|[^�=��]䲤b}zp�,�B7��M�j7>���LE�Ͽ�G!.P�e.6��5�aL�����M�㺪f��� ȣ�ͮ�(jo'K�j9F��f�H|\�a��4�s����oj����-$�&_X��匠�an����*�l�a����	�+{�P�l@?��|��),�0�������W
��G�!X�gN� �ґ:1����ү��@.��h�g��`}��Uդ�}PF�4�i�d����d�T���4�m�;�*�Um���pAY�	:`�o��	���"�K4���+&��7D/rc*b��S%�stH    w�	Pb�����\�*}=�)��T�`��o��?��g�5ю�nsU�Y�랷��������W�LT��8���s�u���?���PY��&hg�}�x��;6>�Kyk�|�~bDȵT=xU�ۚ>��H1���Q����'D�'��u��U�:�>���a����SO_c�`zR�q9��+a(�G[(n���5%f��G���e��&L߸C�UC!�I) �����(H�|z�U�i���ͣKoO)o��yFD�$／�gZ*o��_s`}����bZQUG'��RY�^׺m����bV��^$�IR��0��4���Wy�3��%]s��x�I���)��0�®8�p��XZ:.͚
<\o�zCi�O�+�e��XQTO�PiH� o��i����ea��|��yˏp���.�MIr��I��[�
Ijv�����S��O�B'��(��(#�r�-�bO��~Cå�\�p�\ �2	�t֌�ٯuk����8b����<[����?3w^H�<ؔg�(ޒ)��jp�Oq�eN�S��a��(�(c�J-XtC#Pg�J�W�ñ�L�Uc��:r�;�?cϳ����r�E�?��1�~%KK*�5�8"�"R�G�2S��N�[��c�;H�.+�qw��a�=nX����av��8�P�d:�[����@Չ*=��}������i�!o��w#�j| �
�t��)��K0�S~�몏����׻���A�\9Y����I������K�2�� {�/�4{&�xҐj���޷�[l��.��,�Odog��*n���6���;��i�]�>n2WU��gD#H����'����5q�qh�T�(��X���v�D	�S[^�A,� l>�� ��� )L�K��G^ (,�4���3��-�����h��-U�4NI�W�� �Q�v�z�5��M��A���T�N�y�ܯ�����Q%�#�� �����6yZ��D%M�02ӣ�������Fxy����E���߳ �\e�q�N�?�‱�����ӌ�[�&f�[�~aՉ�Շ�������+$�'3�2�h�뒡H��Fl��q�ٵ ���xWnͨ�w_Ɠ�𡒨�Bڔ���'����|�I��$J��Cwt���+. ��1�U(	�;��O<cdl��Cho	%arṣ��I3YL���'i�\�6�j8�X����+Y�'�t�u�Y����6#Gʪ,Rq�-[�)��g�Z����L�/����J�\��/w�/�k�����rJ��SdQ:�U����#;���<<H��9"h��@���Հa�h,����N�_�8	3��W�潥ъ,�+��6�u)�[�X[@�!���(}i�:�V�e�,��ò^$�T����ϯ�}O{�P�d|U�<@,�t8���I�
X�sj7�H�b��br�c*�f��dY�ȘiK��磿R0 ��0����Z(��IT\�����U&�?=�'!U��ȋQ��� ���#�R�ԯ��A7�'7ܴ	(p�>тV�`���5��5ޗ�A;��d (���%��%�R���C��3"~e���������r0��-)�� x��v�©��,�}B�s(J�G\��>B��X^�-�/Tp�>�V�V0�f�{�N�����6}QiҏkH��������DDA����d?����$�����P{ &�����:�z
���hS�U?�=I�![r*V�Ϳ!+-���0�"�$��&$y���u�졨+�R�3t�Y��C2��8)<��re ����z<m~���-�rI8#\�䎊�b �۫5�QD_皷��s�mES����IJ��{�*ή����|h�m�.��d�֜A����W��Т>!	�%yo$���B}����9��}�'�{�l��F�ӷH��a)Q6څ�%#�0q:�!VX*6�����6e�.�
儒��H�ҹ��ˌ�;��� O��G��k�]o�j�Ѡgͬs|c��Y���R�H���R~#��ġ�3߼6����H���KTX�c�)EO�+�Qn/?c�_�eı�ŧ*YO����R��m��^�Q6'hY$�}�[���(w.t,*��Єo�� �-N��&
��EB���k 0ݧ$e��*��"��-��n��c����X^���ԡq��Y���mB������PU��F��PeY�v���w�ୠ��<�C�E2b��5eiU�/��B��,���''���,�C��e����:����0W�4�����F��cy�<l���)m�jz��0���Τߊ��+=5��0���K�T�+�����)����5A�O/��4
B'�����Aꁱ{=�2�Js�&�{g�d�3y@-#ǒ5w��V{%� �İ;�t�"r��:b!�b�'�쉓�Q��}�n:�b�gK�-���S������_%�3%�u������!BjQ0��hL��+����#2A�l��rJ�gk�R<�Uwس�Չ��v������vfӰ�օ|�H�{m�����<��5����:�oW��<K�z��\Gy�L|?�g�b���w�t���,Y��Z�!lT_n�-GJ�":��ڊ2����S��=�Y��ӗ�E�v�NewR��v��M��Җ�5�#7�|\XZ� �+͈w�����m��S�DL�t�n���ӓm�Fy��ްBK��qH4�
��X����5@�D�Y����Z��-��@&3"S$���G.�e���S���`:B�.9\ʛ �hz��y�X67A���E��zc�Dpϭ�Y��)ɱ.$ÈF�,�����j����A2T���RW���x�F� /��#�xu`۰��O�&+��E9���е2��k�[��M�?F���1�F�#�)����	�y/E��IG� �p�b9�2.;��!��||B��pQ0�����Y�1�o���OV/w�l.��"g'�v���HnW�E�b�)����G&I�0q�v_:z��ej�
d���2��P?�*������S����bY�s[,xm�O.&(x9u����Fz��g�HS�Z��1B��tݠ9�)��r�/8�Û�!�->�&��4�� ��pC���I�d��$&���%)��o�J�L�����P���2�v������ ��'Ԥu�L?�A�dY��YzZ6r� !�� QшZ�c4�_�8_��1`�zP�d+��i,�fF�$El�>�|�1Śރ�g���	ݎũ?8=f��*����ye�hW�X�L�T3no�'����6'�9Y�!�at�oE|��f�/С�R�Ct�����ذ������?��xy���7*��vF,zv#����Nr����������e��$���W�d�j+c�
Mϯ�\:/��ڈ���ɐ�������6�B�u�C}��v��E��������0��WNd��~� �]L(��p�)D���9m$�� L��F��Gf_�@���D��i�*t�f��t�+$!�����,VҶ�I��b�gvƫ_PE�\�z��0@7S��.�a��w��;��J�D¨vV�������w�U����Wt�������� �-C�P�gv,������M�6�Y9���k,�<=�X�^�W��@-�6�����}rٜz�:D��7���~�f�������ѯ�ol�qJ�0����rw�Ie�~g=o�\%��y@���#��yH�������Ǵ�� 	�$��8*��>�Ty�� 6c5�{�h�A��V���1����o���p����耼���s����3�3��Qߞ�(y�l��Ȧ�c����cG}�$����������D<��j��+�m�ķ �XZSd�ϋ��=#��-pG��Ke�P��B��b=�ii�(�>�K�<�gz(�o-
������4�[:I�n%-Nl��t��J�_�]̨�Q���'F�7�c��O�l�$y;�6Nbj�
��3v�	ù¦�q�3�B�+�5Jv2yb���).�9HN��    sQ���vgV;��2x}˫X�8�X�q�_L)���-P|����_)>��T�_����{W�#�fb��FM���S��q��^�J�u��	�]y�ep>�w�}`��?��j��m0 f����З%#�F�X�]��*�fn��79����ӓcB�,�F�4��������zw���C�)���{Y�[�>k ��lk������0Vv�z�W���o��3J�$O��i}��r��9���A�(o/�ft��S)�%v��/NXe;��)���
�r�ަ?:EA���ݑ�#������iaI3Q����>'i]-s�Zӆ�ÖI��B�����g̢ظ$K8b<]S���+���8@�ëicR��Y�|��ɧ:
�pƥM�(
�x�f����Q��Չ�$�AD�#�����O<�Pƣ$�tC~��fK+�b����TD~���Y�̈h��M.�H�ē�QiTk�����<T�P'�Ux	$�[���z�kE���3�GE<z{�4��� n���{Vk�V�5F�I$�g~E�����Ӂ4)r��ī߭��ziѦ޷V�\d���91�S.���-�2�90אA,4T���x!x��O\V����-xO�!IV�19$�<$����9�%f��,Ɠցs�9ǡۣ�`{dE�7s��֔_l�[����H��3|��kHdc�(�39#�x��n�[V�s�L������wLKB��Ω�>i��Y��V�z�=��,��)�g.g��>�Ҧ��^�
���� Q���v8�]�¿�"�
�Hk1J�y�ȗ���3X{!	��TK�*� �e��8�Y�g�Cj�0#U���|��c�.OeU��
@�m3gpy������X����筱��NJ3#�E�Բ�;�z�g?C�S�t��/`ZL}�iI�дA�Op� v�9An�UYI�i��6��OAi�*}�S޺;("� ��� �g���b��g)�O���b���X�
�+��n�^��ͨ���1�k���KY�+��-��8�̟�̩�����UÐ_=v|S9����.��'�D�ӳ���ﺠ�W�^)Yt���p���L�dN� �B��춼�����#p.�{&~�N��
�Џ..T�����2�z1-g�\Y�@~��$UJ�4G7w[�aF/9[i�{ڋ��H�����I��
l���2	�>�!� �Ao({례 ��f���jB9�T� �5Ⱥb��C�8φ�4�oq�T�gEL����O\��6��wX7��߿��a�&���d_GF�B���\��r�-n�6���<-R���^�G�鬰�K�!h|�����,>��E� ��2۶��l*��q�}�B_j�%�{g�vԮ��0鴾����`=/��Y�m�g�L���-�o��;�(b��m�,Pl����*�&�C�[$���c�A�;�8��<��7�4��i/uĞn b���,��Jj8��I�M7��fo���$��ۢkd�g��')��5�w�I�4��~:����$;��E@謈#3�L��0��ۋ��q��"-9tX��I
?n��<�)��H$��QFP������Q�ج8~��pE7	�H��I����"�K`j�V��3��Oo�c���
��y�kgk��So���&�א�%_��[F�?};��ض!��{f�,���J�%I�Z +���p9]+l�y�`�Vfd�Տ�'�fi�<�˴��G?�/#��pFE:��+�(�����,e�A�����{��ZAGb�(G-�U�f�����4�)�ÿ"���i���p\Ƒ;��$���p^�L�
=�G؏;�'q�X�Ɗ�lH�s����[�ђg���|�Xfy�ωe1j�`�K�����]����4ʥ���b�$�y�v}�Ǎ"T�S�j��d��^_�X�C�@�lW�nI9{��O���zs7y���<��o\24�c��,���,+�"?��GY6��{[���DbK���Γp��梗�T��"[;��E��Q)�ԇ��ٷ��i��'-O�E�Fg���� I�0v& Z�����{����G��1�H����t���FO9�(���|�cy 0u��qM.ת�xr\� �2gq�	qS�-�*����J�ܕ�e�D6�ս�5��)��Ur|�"��X����0N�Tj*�u���5�(���=����o�-�V\CI����d�T��������g��I�t��<v�@� ��K_[������+����F[N��)q�'���Acƙʫ�����<��w)|�E<�ݮ���//D����=I���"L�h�-M�$�/M�vB�E$L�u��f��r:L��k���s-|Z��&L9hE�4����4�r�듮����
���˜ߩ���U�jmIQ3{�
�����s-N��?Sв�:�� �v�u���{A\wm��Γ�y� %Y��8Y���2AW�qZ��kֻ!Aom6{1�	� 8ie3NP��a�v?m�����h��=����A¸;Pˤ&� �Ê��ς��r�L��. Ĩm�W*A��铥d���柬E�;W��Xw[��~�ԽXwI�+j��!��4t؛x�����2�q��\V��D��F�h6�P�YI�J�gɮr�`�I\���AZ8��*�����2��%���鰶E��iW��߱
_�n�b
��3�Qh���8����V� ��~R֎@����W0,5P���JRKs���2�a^���U���^z�-O@�{��d�J��Pl�^`��R���am���Q�.���(}��X���ؽ:fX�� ��a�������=#"��B-�S�%��,.ٛ��[^k�'f��q�[C=Q�Ag�]��-V�؃Q����?y�w�ZmV�v����-X�a���j����!*(�?�Au<��Ui��yN8�Y^��i�G�uqW?�G����H糧�	��Xkk�}�}!O����>-\Uմ�"�ʋП^�%A�c�ꅒ��7�4�U\vC�����!u!u�a7��Kc�X|����B�a��!���O�H,)iWfz,�8�IY�(
��keyz �-��B`�.iM�p�c0�SH�o� �^q���T=sh�(.��:�s��OVo[\K���Z�v��laP;�ޫ��-��:΃:��<O";{-��؉��f#`v�D�X�[����)�%e�E�1��jz������VU4=ji�Y`�go VG/zBQ%×Hl���*�w #bQE����,y忹`�{�*���9-�"K��W��{Q�Wi]�e�=�	*z�q�N|/�@���w���c��,���>`u^�ؐ�qP��+�h�ڱ��<|G�³��1Q��{��7/x[��ȿ_Z_�X��0��/I)����7*�Kv��{(�:�F
�W.Ǌ�wv�
HD~>�K� u���-�:�f�LԟX���<�&�̑�3��&����#.y��RՂ8(+�s�y�hs���9{���~;���q�nƧ���w�:DT�l���=���8�� 靥�۹���M�.�d��.�b����,9ʀF���z�d�I�l�{��I�ψ�c*'��Q�I��Cv���)tfN@;\��,;%���@�dq�#��= �/�D���y�T����3�;jʗ����E�a6x�e"��k�ه��S����K�N��bƢ�RJ�ϳ��r�ێ-�ok���f���D��G@�rFV��آ��|�F٪�c�Ś�v�`����Vw3��_K�P�!��8�7&�3Z�e;�d�7Y̨���/����׮q� �ɘ�܋{�
bّ�b�d?�d�󉩵X*�@�`�w9򦀃~ņ\��_�ضY�ӏm�W��>q;�n�R�^��Ḓ�xR#�|��(���߲Vk=�是Ġ�<v��$j���GU��Q�ZYO�S���q�;��w]ӰC�,��l�V��B��~��
9 �-J��) %5��7�~M0cWGW9�G-L��^�QTD���.3�1`1ňw�PV�Ú��ḩ�dc;<oD����~��D���&�g���� ��Q����n:D��~�2J�    �a��, )p�y�Hʏ8���6��'I<V��a�������T� ��Gjk��,l�Di~�/>_~���biģ��V�M"�iІu�� �H���d텀�_�(������M�
�|��!����)��ӑ{��wΘ`�9��&��=%�#��e��>0_z>��g�v2�E����^�O��":���}��*(�ǹ��Ԯ^�;u&������w<��eK�@C�G#���lC���T����h�z���
O*B�Ӧj�Eb��i6���;���mޱ�����L>�.�٩�.�T�!��!6'&V��*��s�7�;�y�N�C�8�
g���֐M�K�K"<�tP{~0��v�L�f�%@�D����=3�U��/H�z����r�X5���J\�>�O�cc'+ X?�T	��\h����%Q�ʣ~��J;Vx���P(��&k���0��b�2���d��ѻ@]�id�4������𸻞�����U������'D^����c�-Y3��_{�;����V�i]+.;���g9-k��Yn�����4q��|���o�L����,�H;����^ջ�p�Ot�.�9]�X*P�ѝ�>��욝���%+J���bE�أ/��f���[����ϐ_:*S�W���(J~�T��Xk����\��)���.�ո���x���.�A���Zz6���G�5�r�3�:�c��:�Bc���i7�T�A�B�;��<�̙6�Le�ɧ3��>w~���� ;sD������N���_�^�^�� �y�8��i�sǪ�xF���9o���r�B�9��fL�8�XC�;��-G��QJH�]z����Ͱ>��)�t9
�I��GT��y��`��(�ҋ3\2T�XƋ�aeN�^����c����O�W���a�*G��Pn�6V��f(q%�� ��� ۞��e�~H0��R��q��D-|����z,v���D�P]߯]�,ҿ���g1��s�ܞ�/��(���~R{��� �q6���H_7SR�\Y�>i_��O�qN�[����K�{zNU��g�i�[�6m����5(�nd��3Me��'�~)k	�����0>�����K��2f��0�d��Pt�����Y�#�J��jٟ
�2b?�N��o��7�����-c����1lY�U�K������#���������C���p}��e�~=oK��B?JG�^�k�V�x[Ўp�� �����R�E�����"
��6A
Mq'�V4�����(��4ΫhL(y&�.�����jq����3?Q��sNQ'�ۛ~`�b6�vj0��=���i�h'�8@�l�v�K��
#���OO�p�3�²�e�oe�"��ǲ��u��w�2��J&�6 �U\���۔:� �~%�b��钆3��/lDY�Y}@�V�3Epd���5]���Wּ�O\����ؙa��*}� �s_�"����(�I��}#��-ѳ9��$�-X�{�/z��OG?���U{.����X��Z����85�?��c�������@���?ze����H���v��es�5�C���B��-?��$~�<�ִ��X�������%�$%\���5�����i�v�m�0�xc���_������+=����ŏ�e�WfE=#~i'N|�'\5� �=���#�fHVH�Z�t�(Q~�`s!�u讼=��ŰJ�=m��iۭ��S�YتߎC��aG��ic�')H�2^$HM��fz��(���	9�$��5->̎<� J�W+No����;���3t���Ca��"���3�?v�o����{;�v�w^�%q����'
Q#+�I�Z���ڴ<���տƖ�����s�qz�>��t�Hߵ�?t�v��d��5�����������2���b^"��(F,v	�r�W.�K�"��"G�����VdA`���FB_?l�m%CN{,O _����>�L�p���%	+|��~�C�,Y\)k����L+�N-D���sM-ȥ����R�u;͟�>1��ۍ��k��#	� Ig�1�z��:k���J˚���M�����,����<^q�L����$2��,	s�ٜN�r5n�jyB�}c�'��:��tn.�ٲ��8:�X�be�U~��,I�*�>cJ�̅0�Woفbt;f������sXk����up��~��� 5��`��^1N���v��n�gɌ2-I�"�i�0V0sV�QϘr�X��e��,�<������{�^�mn2�m�LF%iV�#}��^�VŽY�1t��~���]�%.Y�/v?+?̦�D�,��^�5]�"�/:�����QcΚ�j!��/��dc,��HX���-��EHG]����x~�a�7M��4���nNoci�X������G������9裯�BpE@ŋ�ޚo�)q�m�y/�#�K��҈�M^��X���2�24v~��P\�B���AW�מ���T�yӯ%l}'h�������O��7��(��,ZEo�{K��Kל�xS2 
F�0��l�T�~���$����|�5�E��m�hT�8i�Q�#碳R�*T-�;T�kL���r�G�����I�~�Q���������;�5^zb(s?	e�sB�%A��y��acJ�����1:<�]�����ZEq�H����c�ݰ��ys���z�`�2(�?4�Eִ-^}��-��*d����×#8�!�'����ɒ��Q�eqD��0)!I���'��u�`&ti4~�h�q j�~��3�<�x=O��C׶u2}�Y⻉����3�A\��y��b��n����9i5j�%�ɞ�z��ʽrK�ٚ7yy�4�iM��0-"���I�q"�o�\�/�"��d�kݬa�1o���c�Gm�H��*J�'�<�� ���WpWf�]�2 �F��+s^��0�F@�U�xd�hb��5�N�2�4@/)I� �,��_�ܭִ4*i�.�A#A�>��#�%����n��H�E��;(���e�ki_=xBQ{#�U#��4n�re]*��:\�=P�)�� T*pU��\�Y�E��q�����.�ۢ��t���s�"S�~*�H0�(&��(ԅE��Dl��# ��2��w/�Y;��7�ؗAYG�Z�ƸA���(a�x���Y�M�]��xD�.�T�8�Z{6`ˈ�KXc{f���~o�p�^��f�cq��?V��Ag C*������ �4k
&�ِd��^���GWU'�ف�����'�D���3ዂ�9�L۰�H�G%��/�E#ۻq�>h�ͧ�E��λ%@���|��l��(8h	�,��g>�E����b��S���x��_�6�_G�P>X�[%�x?���r��3�#z�mna�s�Z�v����T�X�E�͈fV8;� X��x{�b�*{;(���v9���Qa(}U�c$���!_2��EQ}���맢���}�'�����̍���
�~'A��v��\�g>|e��SU������[����B�c������%u�s@´�2Hha����AY �_������椁��#��c%6}�ִ�����3��zN�����4���v�t	e�j�Bʍl�.J"k[s!l6(��J�b�8fQ�L�&��Ŋ8�;��W�G��2�Ӓ��V���{d«���s��=����j��7�"��@T1:��������\(��h�1��m�+�,�%\U��M?Ͼ�i���&[&���j�#�aY����`h!�~�?���q)��:Q? Y:DxՐu���iኚ�_$\m�V��pEA������A�	�+��E�!��{{�����+��[<TU�s��P-����/���F5e�#�#�U���V^�c��ؖ�b�Kf��T����d)�֎k/�?�(���q``2��b%�:�u�S��Y���#k&���$s|-j��փ��U��� Pbq�S#�!�# ��C���W{��!/\YG��S���Hw)4wGP��8w},�    K�6[�Ӱ퇝��;M�<^K(��=�$,(E_˦6�F� �{���ɂ',���E��!:����a\.;���;��E`f�"������ [x������Sp~�D�-�Ti�̕��{-�vzedI�ĝA�(���릅���W��<X�͵0{}���<Zw�o�7y��S��I��q��6N��! g<,,��Ę Eݑ�����lD�ark=�(�(aݛ�6#y��ku�c�X�F'3������N8\}�i�zQ�� g�m��"є�A�"v2�!|�VZ��X(Tuֆy25Ӆwq�ǖ��+�&<ғX��IeCy�j��S�X���Y��lԧ;�0��(Ig���2��䱘g�I��l?�:�`z��q;���_9�:��3�R[�d�N�D�*�ڲR�e#���k<ȸ���v��$�[g���8*�z�����S�Xx�h�����`�,�R�à)u83����t����n�T�W'Y�,�P�������yZ�8
�E�X��M�(��_��cp��HVF�1��m)1�gթ��:��6]uU�9w��i�MƋrz0�G��(���k��8�+�~U���7�RZJ+z�y��@����6�n���Ϙ�؎o\{2g�e�l�t5�y���3_�&��|����"���d�Bg�V�N\y��;��Q�=[��F�3����hEQ�/�0)�G1ɲ�)U~��P�i���ne�p`�>��2�v���s���h���\�&q��2`5$jȼ�eB��8-�r�+r���:����oGк��er�+3m֞�6���#ka��Ph*�����7���s;��6 Ǳaq�_J�:�	X<�?1��� *���V�l��I��������j��O����=��Vԗ�������-kS�����	m��� %����
�j�p7(�F�j�h ��-�.��~�*$�ݿќ|R���;΋zz�eA��9�o�QNR������j�������8dG� 1VMuBn��p���ˌ��2K���r���L�M�C4�H�ς���4svFG����h������rR�l9H/���X8M�Nf�Q8�<��1���Ŏ*DFlZy+�մ�`U��c"����g�I0�bު��H�
�Bms����)�oN#͖��c��[Z6Ō[Y����1���G���ӠvU�>Z�׊��N�����Ff,�<k�	YU������[ъq�̥X
�ek%o�4�v�Lc ��ٔ �Y;ZU�)֌y�uW
}7G�ϙ�%Q�����{Ϙ�K"�^/^٭媳b���b�*CV;q�ß�1m1]B��;�y���oQyBʊ����8���EE�G-�w��h��n�k�(�sA�"qڏ�J�v �ÏЙ�Z}�2�A��Ђ����鋞�2G��T�E4�t�(�O��vV�Z*n��V��кU���Z��&K�������~�,tr}v�3�6�l�Z>#��Y�(H��%"�.?`�(x!�΂�m��f�zkOC_E���Wh�*�>��툋�h�]�A�EZ���gGl ��9`Հע��f5*>�jљi������O�[2��܉¯�Z������杛t쪹���k�Y�8-3T �Ŝs�F��M?�a4k]���z� |�� ��2�[2�/vu��J��hi���h��5��|�� ީ�����x�"qk���^̳}{�Ip��e6c�Rr��Y�x��3V�.�l��H�:R5Хcg�N���$�u���*��\W�A���e��Ѕ��e��՗�}v�LR,Y���w��,��;�m�g�6tũ�*���]M���-T��3����I3zZ��+\��s4������E���:�6U�|�Q�YW�K���k�F���4����_���X�x�7_��A���i�8��QJ�(5�!V�1�a�t%�����E�	'��Q
ſ�-i� I�~�n�3Ց���� K��B�5����9�{�|��_/�:K��&�T�"����6bl�17f�,b�w���V^	���<�+g�  ,?(`6��{�7m�4�	nS�3�����x�҈œUp+�2b]L񂙇���<&@ty)e����\-��|�����?zy��fP��5����ס|"[s4k�0��s�nC[�J{�~���3�0��?}@�A�v3����ݦCvp�/��c�3�a��������X�m�Z��&�+~���f�YE�d֥"[}d_��+{��'��sb�ljO��U{G������)�Xt=�1�s���`�G%y���bV�D��������x`u���PEf������#�6�8�jČ��%,��[i�3ed�10��G>�`}��#
�l�λ���M ;����L��)S*���V�O�bE�%E�ē񶉟���7,VL5�c!�g�;��#Uq�b؏�ׄ�
�ȝ>v[=F�x춎��̦7�EV��;�w��1U����,t.C1,��x��x�շ�xXܛg�bO�Մ �/42�n*bl�6ح���4��|����ډP��7U���0TGME��+�A��ȳ����!L��ؽ�	����1�=��@�
���K���z�j�3,����"�b;������0iR٦ñ�����@&�;'����Ӱ��{S�8�f`N
����{v"wL
���V[K��)-�̯`T�M4=�q�J4���Y�!�2�Q�����=�l�����m�zVl�+��*O����L��I�s��z��d��z8�,�|r��ԧGx�>��cpʩ�n$!*��6�E�y�0�9�;�ހ�l')�YW��%_���u�E=#�y�N��j�
��������E�N��P���%X��/��Q�o?�[��p}�q��Ƶ�~�MaWU�ٽ�h�s��-����Υ�+��@I�9�~1�uU��Ħ���h�?Zx���+~T��"���.����(ǉ�Y��b���^���>},F�#�u�4zZeޙz� ���R��y;�;���l���H�X]lGE3I��aa�'���>
��G�x��R<_�Ge����pHi�w$mM��%+�o1,�PL�c�Δ\-�FV���کVR	�n�2�Y���7� ;C��^����Y��;W�ه~ki�NQ�p���B��x�������Hv6v�m��������0/��3`+ +~(�=`�{�`��0i��3%�S|���f�Jg��ǎ�l������� ��	�Z�+�����B��N�M/% �-3ڡk�P���q㢰Z�HO�(���5�#k��,K�qE�j�J�-�/2�e爛v(�W�(u.I�s�����<
�;�i�3���.��m)ݻA��3��pl5�� U��qr�W��[,KfUV�ӣ��P-�Ѳ�pk�.+
8\�:�|;;;y�D3�b����'y3P��-P����i0�q���j�y�Ɋ��-L��@%_�oRJ(T���������ޢ�V�6��b�?Ö?�.�3��� w����d�co�Չ[3ƕ�:��$>(9#t�^WnС4C�\����Gu���|�(/|=���'�a<�T��f�s�p������V���6�s*��Um9��dfd]|ꑶ��G��`T�^�FC��E���|�Mt�!����N�}C	�a�s�� e���mI9���=cB��lM/�n#��7Jja��aK�=��^�3��^M�o�Y�s?��x�aTn�l��v����j"p��2w��cy�y*���q[t��K���)��߳ܒ��<6y��8�i������c�Y�*W>�Ң4�BĶ��[7U�����~Wx��u�Fa1��~���0�ێT��vmvkr_��Z��mp�QA��?��Z����4�OTN�_�a�Q�;�����y8s�)zMe�+�u[��]��W�� `���}�>���a<ٷVAK�ł�M2�>GA��A�R��\�K���{���}��'>\�dn�>L�$�g��0���dT$�Ղ�?y�zk"R*���*rZ��++�����i��*�L�h$�ʀi^���J;�    �����@5#+~�Ki5�˝����$2�>&׀�+��-T�y]jIqj���o)87�>D��j�}��m���������:FC*7a���9~��h�]�mn3:U��U�":���6�W/.M��CK��u#���G��½��M�/��K���"r�OA����^��#ED�X㆟ zG{g�M�ɒ��B7M�'�,5i��É[�k�Ȓ�[�ؙ�mf䷬��G�^�\�.5;���'"�M���l��'��D��Lb�s��Ep�(�qo�4�s�0X����m�������Q�K _��;=�"��Cd~�3j�"I��a�^���#&�7�r����{YMOQq�gE�� ?󔎧c�m��I�Xt�{��:����`|zD&Κ8*���Br�#�,ɣr�^<�4��*^}2�����jZ`�����j�!n�9���M�M�~f�g΁��؂0�d��H�"b&��NTVm�a{<u�1�Qs7A������s�Q�m�7"�La�o��ʊ<g�$L��m��ޡ���W�R�^9ܟ��Q�P��=���-�����5_�2Pp3��ȵ]��^�?��'��2��ݚ�~j�����8 Ar�:5��z�*��`�4X8�v;W�pA�����W�|���~��������(�43���.��pj��u�V�e0�(F)��1fOQ,��!.��= an�����-,�ƿ$hN�=|�1sMH��ÖL0�T'���zLQ8��(~����".���[5Y6#�e{tW"`����n,vHyT����1��0�c)��8,s.@�D2Qy���)�"�6&��̏��y+�b�+,���B�u\mq�u�,�Y���<��'�+��O�W��fFe��K���`�(����*ٯ��Z*�����$z�sG%6y2#*=����&�jα�S�1 ˰p%�a	y4�IA���	��CZ�x����B6e.�4I��k�,N3;.NW9��bC�4/L`�03�T\�t�d� �	�ǃ;��p,|Di��'[cy~����fi�_e4ù�����RW���kU��ge�D�b��[�NC[�V
v����7��v����(@̴GB|��(�G�ބ���x3����Ȳ_�l�V[2���k,����S)<����H�`�Ũ�>��'�+u��]��WP�s�rGV�3�f��v��i�Ea,
�l�Ggz�~c���s�L�a��y�s�~�G�4I��XQ��ݐ�^�۴�;��K}��̼wK
6�,�$	��f�b�35>��YUpe��SX�A[Oj���+N�,5 pA�b�m!*Y��M�F\����jeɗ7��E�^��Q2�5Γt��W�i^u�ܐ�1�=v9ÿ���f(�2jg�"��|�c���>L���c��I��.��(y�TM2}*E�<�0��V�����Z�V4j�n3� ���� ~�;��> ]�T@���gc>����*� cA8�W���zj��E����+��DRd� ���`ԡ���$��]s{,K����`w<У�c����O@�J
�0��7�@3nQ�P�UR-uX�F���P[81_q _� d�ıؘܲK���$|eu~�Y�h�/*�x��&u.���`-���I]}�No�tƖ#DNHY�NPaB)�sEJ4�~�X���}?�1B*�8�G�Z1Z�2���MG�:����wjçhb���<��,,��0�$,s$H��-D�wS���c�j����J�Oo4Z5�i��L�/�rg+�O4��,�(vߩ>�l����9E�?��T����2ctf5;�\�g��,URP+T7�IEE�]*�V�h�U\��ha�V꽲>�&��F��P���Wx�'qߟ�x���S�F�6E�8����p������<aC�����
��͉~���Um*�������6�8sl��Lk����_%�9� UKV�$'A��7k�Ǒ�&u���P5=��CEqʢ�Ak^���a\g=*Q|�~h���i�d��*�"(�bDɼW��1�zSv[]-9�
��qg���M��NtZĔ��6<��q3q�D���%Ij�ٗꪘ���;O�������r>�E��f�Bb�����4�'�(Lb�y��^96�蛰 0�����8���k���<��X�ߧ�Ơ�����q�X���4��@���Ub��5i��Q|�K�y�O�D��D���p���(5���Lޓ�R�$x����Z%�MYK�#tG |���E%=v��GU/��y���,e��=i�Tq:=mEq[�V��<DA��2�i��}��Q��k#��;d��QV{gͰq��-u�Og�WAUN��(���ο���1h[����bH`{Ku��ޫU�Ӓ��b�&q�Dl����9,�������%~�}s�^|P�x@�	-��2C&���cw�1[2Bݽ6���ԙMFY>����K
�<<�1�)[&�1g�j���灝P�Q���o��@�|�!bw<ɐz�;�Ʀ��c��	� ?����Y���#X$ya���/<�*yN�+X�%6�����f�E����UfӲ
J��uh�K��R�O�j�QM����F��Y�F��kw��s�e����nO�P+����!3�������LR�̔��AB��VXnp�1r����+�r�ᘝ������\����)��o��T�� �J	�S�Yfg�0�S��@g�*��u^�M���9q)�i��Hu98! �D7Qt��^���)b����y�:�W�P�G!y���Ο� ƭi�'�(ɸ��Y�[&��`=�D�Ǒ G�$�������G���ҵ����\(K^�d���dh9"Y���W���PvŐC�mG'��BÏ�н���΂R�ͽ�Z�X���"+˺����'��>�0V]$~�j]w 6��,x��w�e��")�$��=b�XL�3fT�E[��F����T����Xyh���t2��LU��`�＿d|fW{�dͲp~bH�:��xbH[?)��5T�ִ _�60��,O�̎=�j*��M���� ���L��q�fYn!=z�Qٲ��ZAf� ��T�/�O,9�j W>����M���$�)�C�R꯸X�܀���3�>lQx����5ky2�"YԻ�b���"hɦb��emXNd�κ4X��I��GL�2�2�v�A�k�
��rԴ��c)$�k��S �]kd���U[�΄�th(㟎 �m�RX����G�\Q�vNv��-ne�|��Em�t�EM������m��U��8O�;J,~b����˗L�yL؋�����y͢&���8u1+�N�c�p�
�r�B�a�NT�ְ.HV/�ܳZ�dF�	��S�"�d�k��-�<1i2�\HR�M��*/�?I�F���.�;��򎒮p*�g�&��Ƈ��H���U��Ĉ}��ث�0��QԷ��anq�SI�8~Yf�h�l���x蝬��~]�R��r�|+G��	L�;�x:"9`�ظ�s�ѭS?���/�<��ÔX�be�qXn�Lc<���#d����,傭P�� ��"��"�����Ȧ�Ǝ��wR��>�e�Z>V,+�Ų�w�v����н\�Y �����zE-_Ae�lƖ:�ED3�k��a0Beހ��V}�FW: �Qzd{p�aSz������?e�!�?��u̩��׻~�ߣ��>n����ԏ�������0X��(����^1���tX.藋�Y>���������4O��w Dh��4B�3s������ ��.������uĬ4�R�������+�� �Y��D�*2F]�1]h����*�|a�����y����>�����P�ܺ��
a�ܟ�����NՃ�X�Zl0:��f2��(۟�W��,��8G(&$�(�k�����62�1p��O��ߍb.��,
�C��r���y�O��Uۮ���*E�
dt%%t��P]��W(����Q�����{�"�����������j'Ěm�al��M����
��Ю��.������\�V0�X�P7�;�
�uE���_Kl ؃�)!�PpUƅ�����~���X� ��:5�    ��<+����?{�����`�&���V$bS�C�y+��#�;H��%gd��^$:�:^�u/yƖ���a��H�YR�μ<^��km�%|�l�ȷWVc{��\_^m�PY�e���Vmi�1�b�J�"�>\ϲз�5Ԗ(�m9�C�����)�i�tN!�ԑ�X[��,����ȞJ���N&��1�Y�׬��L��M���F���56�:C���80]N�l���
�5v���sB�۪\�C�Z����܄����<���~�K���Cٲж�U����Y���Jܛ�o��1�?P�۬�y%Eu�+�2m�v�ͣ��S�Q�*j����hz�� ��5�ki�e����sef�dNd�,�����u�F�
��,,�Y܌�N���YM���~�۝W�S�p��$::�BQ �6�ڃ[T��s������lN1�~��ZӲ*�xz��t��v��U�mV)�#�/
�<�oۭ`�Zd������0ZN�����$���v.O/hC%�����|`Xs�<� �kS�ʲg�G8���:���~ϓ��_��8�E������t��1���x��T)G�Xfy:XB5^���8I���=$Qy=�0����aER�$*����z�('���u��}�H>0��z~z�WM]n�����^���`°�^���� �W�"�K~��}O'�/���A�A�$Ŗ�<�E�z:z/
�s�௨�b�C�-�_x�*�� 
��0�<�c��`���2_�.Ș:7W�|G���TaЖ�ؤ����wjI(Ba<{7�]�����b@)�QL��vc�,�h���R�"���U�7��?�P�27���qk�M!olY��I�_�""����_�]�J�b��ɑ��hg�j[�9�X�x���S�ۇ�Vm����"߾��gm�ػ.zp`�%���c�%.�lx�Oo٢�]/�3 �HxqO�� H�П<\[
j|����?k�n��$��m)(�ꝭ�@�
��L@�f���h%� ��Hœ��V���H��Sߟ�}��ڑR����5����V������V�#��n���_P*�*� �y�ѵVj��ө����^ �����#_�+,4����H���{3��{),Q�e0�J���r�ި���~� �ѿ����םA{ e�KQ,��g��hR�߲�j#1����Hm>��C��s;o�Y8�����K�g����TѬ��I1����N��5�扃�D������dٙ�JB��â�f��#S�==�a,�D�h�~FQKo�,��VPV
#���W��b#\���"�{�����X3��=D�x�S�o�Xצ���@Ea`�ߢb%�����coQc��0�ӹ)�k��v*:�YB�W�����r�������'W/�s%a`���zŞZ����G�tm>�NԺˋH,4۸�c��Vm?���.�r�������	R�L�]�4�����Y=��!��q����zPY%�{�k=P��K�����Pf��d�o��ľ)g�Ƭ�,W%W�'޾��	,YK��C{��y�˻_�;s��;H��v#K�n?c6��W���ad�q�h�^ݑ}�yD&��!*_nbb)�o@�D^���6�=�q�s�Ui<=_~h5v�x�F)����Y��ϓ�V��S�G�!ݯ�sv���t;��r�*���w��ű�#?��()��a��)�[ΊG�G~S���z������+��h�9���{��Y���$�q��iёU��^�;M��!뎇��ܔ�M���x�T5x�f�0�d��6_j
ir��s���Oi�.1f�7���vl�Q��[�\�"���� ��Z����9z�o����֪6x<D�ۣ@Ɔ��0Cd ��#���[LZ����~��4.V�U�7�R¸KV��'J����
K*��J�r� ��K.���綛�������V�(�ŭ��-���)��z�a�x�l5-��(`��2h&kS��x���I��!"<*,���1�C��������ap�߅UA���O��ʬ��5�R,��+�w_ғ����7UX'�G	a�'�3��ZD�A� Ii�ҥ�f�H1���C@���Z:�Ip��S�Ɵq��.�F+r����� �M���踰Ӆ R&KAo��2MZ3�]���ֺI��W���N'��K!����eh13����*b�P 'TSX��o�����X;���j,z#�����[qhA�;���R��a�gv^�2��C �	f���_�Z���'�������4��n���6g�B�VVmqDxV�'�3\���L�E�B���@��-2m�0�u}���s�!P�+��e) C�7\���!Y�]�-It�oa<���)E��%IV��\�8�',���O�H9�CF��a-���9���J[&�F�/���'Cn���ҁ����`�>��B+q��{���a	�rm�(�?���͋vFe9�8`��x�<X?6����e���.f��RRd���J��țR�P ��Vm0c����� ə���i����	�X`w���QG�
��?Y�����:}7�o,��飀(�#kї��9�)ɡ��"��u[��?�|��'��><��˄xR|��A����dm4}��]�[����E��1�\t�X�l��wv�V?5-�Ka��rx4B�����K�\�G��$�?uo�#7�e�>�/��F�Qc��R��U	�c�W�;�|Pd��[ko3R�\��Ёs�3SR(b���i�8�M�7`"2�z��=MW]��ؓo�+\�3�ƃc0�C��%B����zd	��Zކ���r�F�R&��d,�z
MK���0鎐��4�d�|)��n��;3��wP�6��R���ݙ��I`j=���,���kݥ������G.n}Z�˟5c�8���5џBi�&崣��P@�o~�3�]��-BX��1'sq��}�&�K�.��ڕ�8I��]>b1Ee������� �vp9��b�޺.����A��ìI��y��9Ⱦ�?�:·�p5k_�����엗ǹ�$�8�Z��_����>��� !��Q��7.;��*:�j7"Ha������6�:)~�vF��\`��4��76�"���L4�E�^�A߲!��i_���jo��CĚ<8�;
1��������V����"ko ����+"��؛��2�,�H��]�!v�/'Q��}7����^@f�b�;׌v�����4��+�y�dަ���7�L&>��T��'�Ѩ�>�rѰm�-�fm����[$��<�U�|��0��~��EC��?=֜A��$=!�M��YF3�&�[�j����*���=�檟0����:"q�0CS$o�j�x�'�߹��%���R��40O���H-=i��Ӥtv�����n���}���x��ʓ����*��E�eB��?:xQ��Ugr/��݉`�j$�����'�Q��ٸ��ǋ;�E|w�J�vyyn3k��EE
)@d�| �B��k`e�)5:^�����Oc]w;n lMn� I[��=g�Ȣ��=��������<���'�n� AvuG���;D0���H���V�X����i[�WŲ
F������Tƕ� 7e���+�,��dy�g�$HPy4�|�ź����mKH�~��D�B��@�}�6�ǃ7�不z7��`r!P����1<�\t���8���z'^��K,�L�!�8BA�2���}�����x�*��L��
�A��;���� Q�v�N��&n��FD�N���Y�h�A�S(�Q
�L�ɘ[%��R:�:��ve{8Pfw-�Q҆����5��WV֫ہϭ;�f��.w�����+Nt�{e��Fo��՗��U���!�HႲ���J��W�40mtr]�����*$!4�b�0w��2~.ĕ9 ��2K��%"�d�Wf�8�EԮ?+gy3t�w'ER�Ш��'&�޵w3��]?��C=?�գ]D\"��7+Т��N��?{����ކ�׭�������\����E�5��:��,�U�PG�)������u�    ko_5�����yB9�j��Y�GMn�����0�'��+fR��R��-�3���DM���f��� ]Q~�v_\I�w���a��%GF���8�������5� ����;*��@�{����$;���� P�u|�1�#� (r��I��v�溢���[-fxh����}��t��j��#�g1�D
�]�ɓ@�����ݐ�b>����{.��TՊ��-��o����^��~`��I	���_Pw4����޹��]W�ay����,�B�Lg�3z���i�ƅ	D-խ{	Q�����
��i�|��:��V�,�W�8��¾O�ñ�s�� DD��c��/A P�L(�ի�|u���د]��E�6�X^��Y�M���~� m�ז�'ʃ��U�.A�ծ���x�N�}>�C��|�w�#e�&x �A��#�BP�u���i�{R��O
 �P�g��o1�#'�[]i���qX�m����Д�,������B�q�Wm"�Ͻ<4^��^�T����r)�2Їi �3���C	1�Ƶj2GQ� ���!<�'���_=�Î��"��e���l�h��ʼ��XU�GߤGة��0�m��!3���p�1�O
�-m�<)�?�{�ni]��:w���}a�y��л쎱�n�$Y��<�l˄��ЃH�A!��^YY\6�*��Ժ=�]�v%孃�+g@���ia�)<?A���غP	p��!��2f<�\�8���H`�������y�d�̸�+Qm��F�51����]��?M�g/����rD����5���x��!�q3��?��*�Xuz����׎�/�<Il��_-�2�S��]�U���x���ǊN�p]L���"yV�~y�Z%yPD+K�urW��믚c�ͷz��
t���8��P%Hw֏�Η�_>s��"X��@�����}n�%I�sA} �9R�x��B%D�W��&��&���Sy'���dy9\�.3�I�������B�:[�{F>�:�v��dh>T�dL|��$z�j�#Y�B��Ȉ=]}u�-��P���Pp����m�X#|�I6ViP��� ��<^h ^����e�~\��
����⑔�OfU}%j�U�H�*��!EB��m�5��.>�����6M�y1I����D�hK:]�HO냰��>�V��L���F�<��D�Ni�-Q��H�8��ɗ����p�v^��piʾ]�<	C�*����Z��LT&E�㥅)�f��B��%�H�tDXf@�;C��{G�-.�f�&�%>�d1�E���_#T6z�͈ ��w����V{{�R���3�m���ø�o���m�g���<[~6��������xΪZڼsy�'�BA�R��Re�"Я��35g3���0�E�TY�<�YYF_��"���<���q����{b �4�Й�0��c�N�H��Bmo��ݧvg�ڡ7�Cj����*w8�ِ}�\���	�3��rļ��dZ���!�kDH��.l���������I�4M�Ѧ��_/X)��̹�+O!cy:_\*����+���7$���=��Z�����5���Vy�'��H\<BU|HN�MM������\�UՓg���;��a�~T����ay�M�ũ��w��^�PJ �[�1}Џ�2D*Y�fw�٢��#UVipn���-JP�� 7@�?�"�B� ���QzW_&�W���K%����� �mT�|�O*�ߍ�[�r���+s݅y�,<z�/O���8�*��!X%��|p�lw�v�������*֛�yZ�q��h{�Q�@��t!h^�x'��Y�«�H�ڠ������H>�����g�o��Uv�C*�����Gق���Bu�S�T��|�)���煠'��h6
}�<���<����<��5�?b|G�\�1@�Ҙ>6���YRw˯m��4��鱍>C1:xz�YY��x����]?��̇�]^��&/�ԇ��>��7GO��	��8IO�8Sy��.�
l�2���s��#�H!�v����jlY/g�4��<�4���i@B��	�4��ti�W���*w�w��͂����Y�O�4��!�?��}��G ��V����
��������vPD��>bS��P�f�^~��~U�$q�Y�H��7� Q��tb�l�_KsW8��1�@��.�|���i#&ݰED��C�]][_�oei��m`�$��c�����'�`�DI��b�<��?@b�h��G��ǯ�k�/��g�2�I�*����/��&Ц�"���
xl_F��]�ԯX���*�]^#gy���}�d�����.���}?I��аe�x l�\�׏;r�S7\q����?���K��D���8J�}y�YT�F { ^7 b���쯈WY�o��<�:������	��%W�L���n�v�ˋ��A��� bg�/oR�������.t~���-��*�n�"�b��8}Cg�	�{�֥;���>�k��jD1_?�6�/��ٌ1�	OY��	 �rK<*��h|)�y�ԩl}-+-8:/m��@k�mU4W�*m������>n�
�(�߃���w��`�%in`���=�d��Dĥ��L�V�	�8t�\�CߘҚ+B�$D�Ƒ����l�9lw� �%�<d�w�UCS6qvEp܋��4�����O�ƾ�#�����D�^Ê��Ք�z�4^�
��Zc���Ҙ8�TF�B���[���u�QH�Q���	Zt�rW����+�@X�D8o@����,�m���$͢o#�7	es�7�4w���S|$^�ڋ{+�O�kz�� 0�/{��"Q����u�Q�|�c��,�M6�7<p�(�G5P�;���J�=�Q��p򜘄���2b%�"i�����!w@{��3�6d���#z���$��R[�����y�e����δ%�^��{4�$���rэ���*��Ql��z�*�@%�f
R"�ҎM�ٛl]?c�D�AX �?�����jU��3�5�v����-�72�@����l���6��+����E������6�7�F���Q�_Ǔ�z�"�r�R2�ݧ�Օn�� ��P���EEe!��k���rQ�ځ+��6�LB�ab�h�؇���A?�!J���5-��J��}�M��k~��E�i��D����>$�\ܢL|���/D֨NЮ�
3�e�����"p�wA+�]�H�?{a��}���3�{���������ː���7������"$���SL���P
�~�l���"�L��*�B��lP���Z����VF�//�2���H�r��q�f��\��q���+C�Gp��k�y&���A̳�||��U��$>\g
5�Q c=W�i�~0l��}��N/rׅ��i�D߸+d7�=�{Q� +sǳ�4�6���i�W@�P�*Y��@����h8*o�!������"������Χ�,��Б&PԞ[�&�@$�糧�i��)�(+�,C���r)�ҹ\�Ff�#���{�N�`JI�:�/?jz�9@�n@�����.�@h����D_'K�K՝�p=6�UѴ/��
���_N� �*j��0�p>��⃻�ڸy�M-]�z���0���_Q�p���ƀ����%��P�O���링�=>\&-m���R�qzb3P��_�O�������ٺtG>$k��jh#'?=!�Q��5�(}88� jQw�i��MiS|H�wCg��e�Z��Y������z��RTfq��\�z���]�Ċ��m�#�%g׿��ӡN��l��/��ћ�`��z=�!�Z(;Oԩ�b�7��{�\�YY�,��7������o�[��1p$��8���*��Ү�"XUn�5q�u���jʏ�V��X �.N�'�:9�"U��,��1��*N��+�$���Xd��q�4�v�rQ�Ѳ�q�k�|�@����*VU����z���
���y�"��h�B�Z�;�AL��Y\�ǥY~���	��q���<#�+t�D\U����2��;�wH@�n�5�\��E̔�tM��o&�8Ф��,y�kwRy�@�u��GـeF    	I��`�dn��3����8r�_�7�Go�C?lU�o��Ạ�H1f���C6��r�Wemp'�F��|f�!N�hsN=j��@$��^1���$�\SD�ti9z[� KP�
�6�-����"e��7x���`4~~�B"g�ģf׿����W�Ū�ɔ��k�gt�� H@e�U�D����oX���bU�E���Ԙ�3�����U׳�Ǹ�>����Y��Q��$�䷏�:��8!m�����^p#l��@h���4�.)�+B�����&y�9�E�@�td-	�2��^�\} qA�
���?����2In�!̓�$J�<�S#l����ٷV�����0���^}ǝĦv/��0y�ny�:xN�:z��t��m~�J���l�~�G�C�_q�\���yc�����B��E�X!ҀK�p���Cu�U�L7�m��9����;�t���$.���"�U�&ᆚ�=�]]O@'��ɋ��]�B��V�\��62l{w���S��g�)C�a�V��O�*Λ�7ڽU�K�<���v���=�o���mK�s=|�c� ��~+�$n�l)��J���e�O����8�+�s����D��S��䫇p&qk�}�Lj�{^��BV��gh�NNUw�/�����u]�I�~q�Io�]}��$�M�ry�r0ߡ�etOV�q��
�m�^��wz�>��5PF��zp�Ia�DC8��΋�'��]�>^:�I���7c���4�r��?�3��X�O��$n)�&�h��	�����e$.Q5�'�4��څ֥V��n2�fq���� ��R����٫�
�@�E����*��;sE.u]�/�m�R��W^���h@�G��V��P��2�j�F��j�2l�c�	�Zd�����'1�yy��V���~�
�1N����>���`�	ȁeK��	/�jj�?Zx�����
����)^2XS����]������ĳ&E�_�Bl�����i{����E���]�d��Q�[q�VS���t���-U��I�x���\�">aKZz��^����pW֟ϓ��壃4.��0�їP?c�r�������*:�}����K&�,Y!���IR�a�@?B��6��m�U�|�[��A˟�?p�(���Z��s�C�]�ܔA�ς���eR�O�0(�� �z� %�ج�꟤yf�+�aYŅ����F�'*:6�����
qyF�^�=����J��@�4�)#K����ܕՒk�Ş���k�ekŋ�J�^��F Zȣ0�pڥ�>:��.4�n��� �%�z2'b_��%S�c?S<�=߇�(����% |ÿ�$ب��T/�\��K�-����H �~Q�l��4p����.�+}:��KG,�_Z�d�lׯ��z������$1�^���
��g��_�<�^��%De��P�gɥ�]KҲ(���J�ĉ�*��8����O�'vw��Vv�/�di���~�[�6��˛�/�PF�����Jt>���(n��Ő-��d�M+?��U������P�k��!�����.>�4"�z�M�eCo�Y��a�^��=�M=��F���5dR�8�H���y�p�߸&��t�ť������EI�5ߠ�������>Y���[����z�y�:R�,��/�i�������Z~eMgA�����\G�x95 �
1n_=�d^x١�a����@0Ǣ�kY�/�"e"�~���dE9\ٲ��"��$�D< ��G�R�-W���>���9�C�<2yl��̙������H*B·��.}x|a�(�� >'���=��q<>Ԯ�Vv���"���f��"����������ї�Z�� �l�ܼ����PoN-�u�P�_�� ��J�*�6
�6��4s�9���wS�fU�ɽk��%���b~����[^��y^�Z��x�šv���&�𮞙��!N��CsW��9*��/g���	�u>�x ���}����(�OwI�K�+^{W��Ǿ���B}��5� /�.����KR�@��?��.\)<{Z���\�c�gq��W��2�W�e�1��|Ѐً	U�Am$���S��Kzڀ=��jv�����3j@G�\�� oY������~�_&�[r�`�w�R�)��X���j�&_~�q?���4�];݁�� �E�X#ov�Y�/��~�Kb�떏
����	e�ȸ�{C�P�2�X�Ɯ�F���n��T�|Y��� �ͺG�_^X�2�Aװ4�h�rR��7���"�$yS?L�U�k�]�GxX ����JlZf��z�V�������
H�[��}}+AUI�!�!Bf�0?�۲^�d���x(m�����A�λ�*�(j�`���F�8����Tj�4����ʸ���yׄ�u�rD,]O���3�����z���$Je^���<��$-d��z��	8�K���+i���s�BIO*�G)"�w�!ԄY=��hl�ޤ���u�،��n( �u���O�)���u��� m�4��X@���%6T�L�!g��\���Bo)�/��غ,�������TH��}{9r���N�^cs�n���h��.@"�Fq1���Q���\g�qF�[��s!JE����X��GZ ^2������jQ�-��])Z�m��E�੗A:�t��7o�����x���Cm4��Ȃ�� O��Y{�	ʂ�~Ē��op'�� `�a�W����O��X	n�8>�m@�f�>ož�/��2w�9�Eq�Wo۞qR��K���2�`%d��Fĝ���@XRi�뇪��\�6)�rR����=SS�?�3q'��/^@|�k6�ϳc��54�~R�S�9��s�Ԇj:e�~LAa�:_^��I��+��rb�0���-�߽� ��D��OZI$�Ç�~$�k��+�kej?ܨRW�=����uT�z�n��U�~�ur`>����(�Ia�{x��b��?C��շi-���_
VM����0���9�,��c0: Rg�M"��]H�)=^�7����}�Zk>�r�����Z�jT�1�-%���fє?�j�s*�£J�R��	���&���w#��!k�x&�.�*��-4��n����8���'#E��ay�z�4��TY��c���['���f����
�EQ���a�&�&#��N����E�n��b�2p��p��ռV:z��Ou��#�n"��s����P�D ���?J)�*/�8�X~�<�� st��	,�YT��� T���12�_�}�_s�
w�}�WY�>~zAG^��X��GA]�0AR��,� ���+�^,J��Y��o���2�%bE���6�G���f/��Uv�3�2��+�eU�ҋ_TeTC~:R^��3JO�d�ԁ��"X��%:�2�q�������o}Cᅘ�zW�l�2��o������z+�"O�'�v�M��}S��.N��?U7О��6�ң�`��l�����y%y)+"ܣZYe��R1�;����?�e�w����2U�{���ﻝZNH��<�p� �׿�����Ե��u���L�RH��T�����E�k&�[� ���ZsE�po^��iX�������� �I��5]5��`��@W+9���\�o��٭�\�y�/_�WUl+�ØFdr_K�K{��6���y��ZE�ܛ���P%��UT_���Y����uYB7uř;?�~������;���������H��9���߿�r���|�,☻?�������W���m�pexhH�H�T=쵖�u�6<iy$��JU��i{n��
J$���'!�&Tm�,Y^o���$>D���U)r�ư�&��>*5kLM����
bW�p�%�U �~�U�J��>���+���v��L\E��Ӹ�>Sh���K��1�>q'Umۉ��JQww�/��Zڿ��|�0���hןP�o�ry��ᄖ�=d0 �q8~yF*��;��l���.
�;�~^�p�o ��+.tam�A�A��q�V��Ϭ�߁�y@Ehu    '��.��ϙ��f�<L�$:3J��'`�赤�V� ���ANAs���#�sl���g�Ml�l�s�����$�>���>Q�x��?�*l�1m��c�"��盤�+sE`�؆ÔF�_�3��h]�_�фRY,���K��ZS_����(ɢ�qe��+^!*���u�����5Em�k�RVU�H&�/H�ևӋ� 
ZF ��mi��0��o���A�WVI�4�lƿ�u���n|PSJ�k�1&I,"$1�\���v��r�=y/���E��:#�Uޭ����ݘE^�]������|?�<[}�5�4�����W�����#�(��P���sp��*:0:J�����E�T�dZ�M� M��K�1�31y��#Ġq>����*n��y��"�׭I�2�{�G�l��4X�"fF��@á�O~��R����׭P�dQD5t­X�أ�㼹"�ڬ,��#�����?���>	r=���+�>��m\E��
��8�u�=�{D+_?���L�X>�E���A
�A\�8_xA?�x�v_? H�au�Mw�
^�*�xe���|����Խ
�/s��z� I}q�6�8gx1O@BI�=��w/-07m;����gw��b��m6$K������p%��	%�k9
%h�aMuؚ���	�>�P�X�?A��o���S���Lc���%V�*{wzD���6Ie�{l�׾�9
-��Ê�|(�+�f���E�i�êTL�ܱ�h��4�>?�K��T�4l�]�o F���kbTTU�c�F�ЀI�;\�,�3�ژ�=�jc�x�����F�^5ф��p���� qr�fG�o@ѽ-��Y>Q��<�4�iݷ��tf�ǋ`�G�d+����ʣJe��bW*�E���݀�_[eC�|��Y�L���=NZ�cX���g�z����8�z�(}���Z�~����j���͊�N�^q�.�G��*����W/��Jt1��2��h���mʴ﯈Yi�pE]���X6�sȰ�ϰ�i�|����-�኷�4Ae-M�荫�_OۓW��<�DyϚT�Ɵ�!N@`o �v]�\Q�V���B+�{�'�+�`>;q��@��������`���Ci��-�	6�ӏ��ٕ���#���$�������]Z�s�j����2]�k��i\.���$�/Բ8�:��9���#�̲'�.��q?��VF�n`s�Yc�5�����03W�s|6�ؤ K�=-�'B3g�	1�-�)#4�v��`}]|"�'�w����������̵X���m�/p�{x���"|����+���*W]�6oDR��L�d������~yqf�2)��̢ҜS31_�E^�������$I�O��m�/g����f�{u�p��CT�U���H��N�.@ҕѣJ`�2Œ,�� �kSS��� Z}Rw���d���
�/��,�������>smz�叚��F~2��纄�࡟/�p9\�Ⱥt�p�B�����k��5�I���&+��k��%# D�y��G�ht�!���A��[r$/G�o c0�D�I�~ya��6��5/�1�'���+���}� �\�W��љ�>��/����&W�jeU�g0Q����0�W�m���/�3�K��L�G�z9�V�@���+��2[���#��'}H��Z׀ �r=����.��K� T7P/�C��'�&yb|�j�g�O���Pe�h�DCU=��P�U���wv���(@�d��[��Ѭ�6dY8�=sy�{6�F_	tk�v������h΢���9݄��h�$�׻ j7P#E�V�g)��+h�Jf�#$`0?���r\^���8#ƨ}L��q#�-�ݜ�����@�`�\�� Eah��[^�A�%�9À� R��BJ\��x�'P-�ĐX�L�����;3��q�z�h�<����ֹ�-{�aoi-2D����<���(���s'In���l� �F����4 MC�ͷGѕ��j���e>髃`嫿pi�ծnX,c� I5Et�P����bm�_`e��i;�?������Ti��+�L}�iʈrd��c�<q����2����r�@���i^�*��A#���!~���P��K� �&��2)��Q�8��Ȕ�o"Ӹ�+x*e�d�x�ǜA�( ]P4ɸ�ͻ`J��ǅ��s�t�D]i1�Q]t�]����X����ɭ~��]a��%�a�s�'��*�M�5/��U���H~m�D!Z��>(_���7�]��0q_��D��?�i�0@�s"�����۽����!�C��#N8��P��@���`�f|%�k��3��W�}��ȡg���;�ʒb�D��h� ���<ɷ�R��}��M�����J@�倬�=�.�W-�q�#�:� ����Rq�Wߑ�q?����4�����~NN���y���n~����KQ. ꧟gEy�z�^�$���Yf�X�g�E_A>�}��E�o�&��~+Īt��o���gB����կ��iJz�]��T~ƛ��q���Q�&`�)���97ӋfC׻̳�)����Y5�D�r�V�LP���Cw��)�&e����1.�p���:x�����Wb���p%�}ٶO;�qvEP��H���>p!T����hP�����a��#����J!�u�;PVy���6z�(����d9=?r��D��u�׿�B��`m�>�����V���U*�"�@?��|���K���ѥ�MpT��j���4l��4��\��UY�\^B?��ʑ�.U�d�)�~�.&�����E��ft��xv؁��#���/�~�X#u��i�	w} ��.�'/�m~V��B���ǀϬ��,��G���	R�\ �������o��o:��E���6�X�<�*C�����<�,�e;(h_�	~��n]�ؓ,@���(��3uɳ�Tz��E*�c��HA$xc:jJz����w���QSwd�byCS�|j+�5\v�Q�ID�	�/�k�b^�������}s�bm@=p2���L�5�OҤ�=�)��r֬���}�
�, p�8I�'��R��P��-�lp�zJ�N�<��sp
�x:pU��3���I�$�����^
rN
���Gq��G��|��7&P�������q�9~A�0ܤ����$A�<�KQ�I���6����Heb�q���MJ�$0�!��1d�܏�P�
�?K��b���N���MZ7fq�Aw�V�/fl�/���SYJd�6����\�;P�]v_�F='��y����.��ǲ�P�U�<�Y�?�F�(�������j<`$'�&y�>�R'�\��k�m~u�J'�\ s�Ia� $����*�L�\a��ؖUP�Y��A��p��-mޜ�ȨL��=�Ndm��.����l�7>kl�X�$�K�4�S��%zg2EOG��O�tݩo/�~��bóu�s���]f
�+6�6�>�e�����4��4��Լ��J��M�n�%���1�E����I�2_~5��̼Bjm����p؊��Z�A�
�Wo����ϻ�;� �U���1l��ˆމ�"�O���~.@����[^��"�XQ���,9��a-�e (2/�b��E�ku���.*��Yή�j��\��"/U������B�J��#��~��8�{�=�pY�=��p����h�UVM�q�6}��	di�*���1t�Ρ܃w���vFPE(�.���#��m�V�I@jz�:�+��˧=��{>�1z��C�^�~w�(�ҟ����ǚ��ܐT��7���{5�Q�B�޼�r�\�W�)���-��8x�g�gԼ"G��j��<t�+j��3Ww�w`��7��Ibʦ����l.�yT����ky�������i�iB�(�_�wt���磗~uG��Y&c��.�`-��M�y<P�W��n�di�<jUY ��y�}���������$���>Q���Nթz�����A��_�`�&n�xi�7ܴ���}>�    [$1�m�g	���DK18����_� h����yR�Wt\i^daiW��7y�Ͳá?�x0��g�J�2R��b��3�g��8c��
�4�W��V|�<�x ���"vm,D�,��+Y?,27�/��L�"Z�E�sձ*�(��[�!�Δ�XR�()j�m7D(s"�l
q��=0���퉺�w��k,y���4�;��T9=cK0p��}6Y�����>p�=�O	@���(��
�%�$���t�H4�?���{� w N�-Ӣ�)<RW�v���:g�E�����7Pa�.jw�� ��z:���`0\Á^/����X&y��&�3#�X���N��r<�=N2���3�-M)z������]�D��^ >��.������fy��V&��"���?��M<-4w�X[7#���2&�t�Zh� ��8�B���Y�~�wN�2_�d�8.s��S����	������gƝC0!�B�M���0Q|
�	j����缪���"z��E�z�f�ư�b�<�� ��<{1I���A|P�����;\�Cu��K�$H� �C� ��}͹1|�_�%�h���2'ٚ�[R��h�IL�W�F<o��C��/���|��+��Ȕy��	���((|R�\��#�p�����2Gf2���,׏n�I���Ǭ�M�ԗ�e}��_��h�˥oO[
1$W��A����6��}����e�f%�[hK���?��	H��u�V�.f ��*WD������y%��r����&�oe��QowlԤ4�cFW��ӄ6��>(�$�'�-P���"IMV,���)�p���&7�쵩����%��f��P(�wG�7"�.�#(�N��Nz�������Lf���3���l�3O[�9zV��a��sH޳h?�?��KɆl7��r�`�v��g�,	�2�~����D���Dܝ������%::�z�t���m(�G#�y��¯2�k�~ �+����G�S�W"axY�0F����G�e�r��ސ+ܖX��mA ���@d<;�	����9��¸A�0��əIL�Պ�o-�(�y�gƍ��'�K\��Ѯ=�{Q]�Bl��=����- ��8N�@Kj������æt1\�����"���VYU�-H	}}�	�1n;���u�����:,L������.A�0���9w"�� � ^��'�׏]-ꢺ�Z��<���"z#> ��	+J`��hOt�����$Ќެ�E��j�"�v�p��+�+�n�1exa��7�z��6���0�Ⱑ�a.���Xy�ۋ{_�z�� J�����;�<O3o:��B'*��W�պ��A=jݽj"��r��26�?,��uŠ�HG2�z�UrN��Jw2��"1�)���I��e$w�ؔ���0en�~y��W6�C����3�o�מ�i�ۀ!��M��B���� �bS�u�F�nt��/{"H�����`W��C���a�D�*Y���{���e�ML��U���ږ�@U�\��}��C�G�1�ʨѭ%q�X��1�މ�r�6!�H.��fzW�ˁ�=PM◷PjJT��
5���_f>N��T�J+����0�Οt�8Ȑbꁂ��,'�H/pv��Y_Q���یb�*V<@ � ��b����]��*�k�2�=PÓp���Sd�:ˮ�YX��ظ2��#���<o��؋�g�='J�b��hx&�g]�qL%�t�C���e���uMmp��r�Vo�/C=�j/R�
lꅴޙ��@��6����X�zb�()�,��O�~�m!���M��� �<���]���㮀��̣�,{y�3��#VS;��~h+ꕗ�������=m���%���x� �{CAj${�6W�_yl8��>�{��9���/�UɈr�ד|]2�1�y���lA�tF�3&�/�l�qH�`z��ή��%�E����;���~�:�sTՈ�i��K�
���B;�^�.��އ=F�����N��Wa�	�Rd^XE��E��W^��)�/�:�`��my^�>r�~�V�pO�p����;�P#n&S%GF��b'���������J��R)��"`�ҿ�1<�q}UC?1S��s�7L4Uhv�=jU�\r�G8�W��Qm�5�٨��<�FUU��]j�ٰ���5H�謫|�2o0�~�R�����?����+ 2E��-s��{/�ɦiY�U���|�I��,�T�(P�eWU��J����������q��,N�/^��H�0����#��J�-�����)�!�ezE|�g�dq�%/m�P*����c.��o��Ķ��Z�I��?Y�	/>��9��I2��2��3_-WH�(�����Ȗ��[��#�M�t�2,EX�P-�Hb�����C_�]�(�vR�ye������+&�eb3/x�� �Փ	��*�y������"�/�c���0%��0 �C������ ߀�P]����2��l�uR^ǋL(0C@��c̍�(�v�v��^7��Z-�M��	���]N(�|߉�M�T^F�_5�}�*����EV�W���c4&B|�Z�(�Y@��H��EA=4m~��)LZf>"�;)�FƘʲ�$�n��`Ih��,r?��',���4���p�j�<1-�߱7qm��^�,�8��$�>ք�� ,m�<��;�*#H� {�&���/���-Qcߛ�!���1;M��WPr�$N�o��$�H���Rp��~.9u��������m����{ɦ�+�*㾶��IA�׃�8��6J�����'8��m½k�e�09�c����5�b��6	�6�1�R���i�D-�0&B�l�LŌO|��J��nHф�8\��K��)�
��H�ۏ�l^Z�`�G������ğhA� !eM,t�?�X�5���WS'l��/�`�~�B���K�{Q�Âf��@�<����I��S�>ؽs��q���.��p)�)R���7�Q?�0�<��m+H<l�@��/�|�����A�����ZU�p~�祝6�]���oQ�~��%&�u<���E��B�X;��W%� N{�m���n�$?�Q��=�@������u�bD-~.���"�1�A��~��n�+�ǣ(���!�?�݊�N�Z?̻-\IY.[�j;��&��+�����q���N|��G1��8H�H��WJtT�%�t��5��dv,�\�G�#T?{AQN�{�՝z���";��C4:H$l��G�������m|���Jx�x��^�݀���hl����<�v�C��e8�aqڊ����Cy��m���Kw�l�*�
���0t��
ދy���v��Mv�m[ۧC|Ex\�����B� ���-��̍�aQ�у���w[�!���X�Aљ���_�$ql�0���#xRӠD���OS�̋�룵�E�ݯ���>���]c�~y&L ��C�4���<���N��2U�Jo:o�q���Ơ���`�����q���&�^f1K�����8�O��q�:<φꤔA����љu�VK��d�2��2i������4��k����!+��'��~{A*�� ^(t�׽{�]��Ť�D�o6���Iƅ����� ����j>.��|���Y��Δԁ�z�o1Ho@��;S��C��e��c�o/�Y�3Y2��Hx�ۗ�n�_>� �R�"Z����(��\�Ll�p���S6�봷���}'0%�5D$=DL��"yR�7�u��]E"T9��{F�ɓҪl�V6>�=��\D� �LH(�(P*L�~�	CH�Q����"�Cr����msb"���;�R5�Kk�b��8~~t_Bs6�
@C6���	�b�G�	�¹37pKk�:���]^�,��@b�%L-�g��ኑ���nC3/_��s�!AO�i�ӫ�t}���|�����w���������NDKD�!���LH���Ғ�AI!��E␔]e�&�aZ���d����ԉ
B&p�D��p������^7P    �&�<������No�]��7������._U��eX Uȿa�^�_8���崽GT�yT�ϻ��2�۞���� lȺ8]^��Ǔ�,��H}f5�F��������P�(�xz=ăŮ��K\��"��]U����"Ϫ�UrfLZ��T�Do�Z-L�gX���Ω�jfƟ̉�ɬ>�6�����`$�ei�*:~H0(�n�i��P�$�b�*T/�$��y.��'Ml������L��H��U0I%=��u�9���@�<���ʲt�ס����QTi��2��i�XÑ�/2���RE��
�M	�����n�^�ڼ��*�y`>Y}&1���g
����^�J��a��Q���x����L �ID0����+���qV��ۅg��@�B_��(3��q0y� �����_(<g�d��֡��+J�J��"���H�=f�M�D.��o[������'�$�D)���f]~�u���(IQA����l�_F�P�dO)r�_�ء��`�qS�P"@�ע�
�`�\b��H�_)�w�|�l7J��4/9ד��	R����� 1���G�B���x%`�&-��U|�m�0���mF�P��Q$a�C`�%&�{]����~3���+��&*��U����{�W�3���qR�/���v�g��U�e��(!E�>���#48"�ڍI[���w���\HEH	�>Ĳ\��=��w�^Kc]��4q��AV�O p� 
c�����]Jぜbi`�6�{L�$���d�l�X���w`&ϓ�w`&��sx��q�%�&b�sHڑq��LOE Y���Tp��e�ý,n��./�M� N6i4[(��C��L�f ںLޯ�Sr��+���"N��~|b�����G�iBZ�����sT��.ÈP���"KҡH��/yjL�w��:p�5�Ԁ���6�n��.���]�@C��Y��@TD���V?�˒�k���0wUc�Y�\9��/��ɘ�4��w+�Q���i/�>����e�5M�|������H^)Y�uśF\�� a���f,W%�C��.ZAO���П��PuE���_�*��}�d�����}�8�X}�����y����2���@$0N�U;S��41Ū�b�C�=�~�R��+�`R��@	g��՜d�8l��2��h������Y^2�`䄢��DʑM��5�tm��$����Ǒ[=C0Kڪ���)�@�3e�4Lպ�Px���&���J������fIץ�OO��2���&ɉ�d�*�9Q�B<�oΞ�If���v�����<���"^�<�o�fR�Al���V�S�Ҭ���w�fY^��}���Q�#P�����=�-��B���?1���w@)������E�'ˋm�I��ڔ�d(�B�c�u\h����{��A6B��<�/F���+�V��y��@I�����/s	�����!�7p��:.���E�f&�"�c<��|��hNiϤ�Ewz�����>��?��MqZ]|��4��V�f<n��v/*�_>#�뗳Ȳ�=�WD8��<<oy��+������w��=n]��N!\)����Um���V�/f��y@�5�_^����{���VYt'
y��1AV��,����_^��|¾�"ut+[z�=%nY.�����6W�EQ�!e4������N2Tצ1�C��_קJ�G̓��^��d�A�W�U̲��W,����2�HU�v{�F��<L-� ��<��AףQ����� �K����~�A1CI�𛌙�j �f�wy7�/^��rR�=�V�c�#�Z��}������æ��"M�^�m~�0<�r�c`=z>IM]Hh6�z�
���k
b��i��r8X�l�t�_1C������y!dz*���IL`�)�?@ ȿ<���-o�h��aP+�F�8��
�C���Kvu#�Q�xD�w�lbŜ��r�Iz/���޽ԯ'�/J�D���G�m�k�ت�d��_%�H�����/���!���ٶ)�ni�V��[�Z۲��^Γ��$�-�(� Lo�@�������In��3�4.CF�i���N'-;�x��:�����q)H��M�6��cc2�=',Y=�33�I��6��\h���sFi^�c:P�O�kHE
��NxlIV܉��]�l{fL��W�6S(�u=�v�T'��N�̸e��y��H<_T�ĥ��4l�zq}���`I�u��Y�cP`�*������ �ܿ1�y�kz�#������t�~d��S��ɫ��������M��^-��� ���w ���4/��N�� ��(=�g��eK��?��M%��`�W(\�~��.r���v����RBP6<������DU�x�L�̙���D�l��9c��^�r˼�&�y�>�
�d��
�)�p���|L'����y��+Q�#0����D�Q�TɅ�F��h�3��)~�3�h�<���텓f�������v��_[�"-�@Ԃ�F���&�<%��]z3�2{��ѽv�U<=G�w����q܉ܑ���@B�i�]���'U���0Iڋ-��F��=�Pf���W]�&�m���7X��YHoڏl1�~�>��Q�i�0?��'pb	�T�� 
aB�G�B3����Ĉ
�`"�R<��"t	��T�Q��=���1Z����4�o[�z���TyqMMY�E _��Ք/�+
��YGM��?zp�0�Y�s�f���$ )z�eq׼���\�"2\���x�lg/�n�v�A8�
�(�����_k���Q�[N��LVM{�^8���w�L_����[��"Ȼq���U�n��U�+��I���KIy� GĪ�y�:��U��b�H"�ĨG*���T�/V�y~��/R��^���?��|�BI�+������E�g}ż���4 
�4�W�`C ��+Xvm�=����'y^�W�šm5��%���b'�r�eZ��#C�s�u	C�z�o�A�t��b�D��ͩ�^����	��9}G<G=E��d��9���I2J�y����Mx71p~�*�p<b���{z���2F�;����_��N�('�[�e�w�Kj��pViB-W �!?�)W�!�I�'g��KG1��s8�E�]�A��n��8����ȼH�|yڮ����H�k�y:��?�&/<u�=s) t�I�V��8�_4'�˶k��ԫ2�6�)��s���J}�0�8=������7�v���?�;D�#W�>�c0�IZ�`/���pE�F\TD0�8�X�~Ra>Tub�,��Z��װ?)�l���=R8d���R�����q2���^b4�&3m�<T���p�`��^��[H�˓a(�_|�ܕ�W\1�ũ��J��%���nGrU�]��o2�����1��E�,_X2DN}����{�#����z�&�5ϖ�� WX��g��0��sb������d���qS���LH$W[�y�D�?��>Q���Ќ�F�a�f��G �}8x�B�l䴎����i��9^v�M���ڲ3��"�e�C�4z��P�w�k�7_⊈$��Z�:I�zyD��b�eQJ�,��P�Jta�FU�Z,��@�v5�.'N���k�d�3M��r&�uM������C��Z�]2b��j�D�Ri��C����C���+�$Kmȣe}T��	�7���i����@�+���n.�?�gбJT%�:�M��f�-9�qX"���,F��S�����G�*F�x��������~���T�Q\�H�cū��|�����ex��/Â��#�����_w�I0�t��/u��	bRG�W\������m���WU�(L� se�(� pȿS��|���"��by9�c��F�jԷ��u6�C��f��ݦ�(����$A`��Ne[�2K�^�E�B�Ȑ�����@��~|n�ׯ6SU��8*�`��-�V�Ӄg��� b!�$HؚJT1Z�۳�Q�x^7�؞!�$�Q����'�����    ���QG7�e���6��!z�?�^/ $�?��Q����	@�	�N�.�~��ޜ4+Ң0�����T9�7�����G�C�DP$����h��I���y��#��Ү�T�$��1,��B�`*�(TS�bYE��Q�僋����f��c�ry�be}�9��v�����A �J~	�1�Ky�n��xyk�R��*��6��%�a��L�����/*U���v#8�hU��z���2�byy��<teU�Ѥ�Q�U �\~���@��;W���ҝ� 
�~���_��>����ʬj�+�i�I�J�{?;	�J�9��I�6;��@`���W�\e�V!0Y��@Vo��7#E�3���V��+4���ɱ�[vY����=��B��fKr�~��8x���_P��#u�e	��G���y��V�O/B�<�n��h�����E$���/����ǉ��|���7���!\1��+)��%�p�{�~�BP�c���o���k%Fq_�R���\Y5��}�]gI�<�L�[� V�^��3���g/c��C��ܫ��ֿ�,��ȗ��YVd�nR�z��B�S��;O4���yf���)�=��3����{U�W�WY^� p�,v0�[�:�Iѽ�a2�M�iL+�:A�C�I�Ob�3���q�|:���}UD�So�����+j�/���Pi��{��H9�����>��몺���W�$Y�W�<~�6�RA���P?�ݏzw��m�'��Y�[Σ�E_�1��L������ �a�X1�C�J��օ�$=�����ΏY���%܅~7�.d���=iˇ���9'�;��Y���JHl>OMy+%�?\��+�Tp�=#
�
P!�@Ɍ��]R�Xʍ�(	P���{o�~+¬N��>�<�e$��*��-_P�n���玘�뿣���折���hbXp��rw�z%&�{%wN��ϣ;k-Y�
��3�@�؊��	'H9�j�֏-��8i��^Sg>�It������e�x����xWz�����r�J�f���ue�>���,u�WL����6�sͧx��$��s�@��B'1��cD"b2@�ݛ)����(�\k�I��m޸��i1����e���^���ƚ"\�LD�⪽�Y?��m0h�4ƻa����F���t��r�v�r�t�úz�~���Y@���D_	��u�A蔏4����0�v��d��#\7��l�<��9��+j�tM�)ba�B��L�ACHn`mؘ$� �j��4>$6��ؿ���;G'��6�ˉ�,���"��_�����~>�l�;a'���TM��ry���Ք>~E�}��Q�[n�?��[x_zmq��#"���uN@Pݯeq�L5X�G���T�uY��o�v~�2zG���l\��b��¦��a���IS�*��#"|/�z��fK�^�'�DI�����-�,і�$1t����ٱ�"r�&����b����J��Zm�O�m|�"s�%p, n��#�X�*�fِ�+�X���$�~�(�F2j8�}QKK�����''�V��8x�*�&�������~Rn�4��5+[U��*�t~�d� @�N�e}�ܽ���7�+��+Ra�eURMX�@T�"�(�ʭB񽷐�E#D��Y�m1d��W$I:�#}��'�u��O���p"��'ڥ����~@}۔��"s�vx���^���!���������+��ڇ����e�)|B����S ���Cߖ����������x@8�����#G]�J7]| 럊�]��q�������𜁉��_����S]{UYW���Bz:�.>.����}a�c�R�k5����Q������ً>�3 .��*@����w����lXTii�SC��"oQż�w���y���ͽ�)7pǽ&I]�<Qp9���6\T�OhӳҸ1w�d�.�4�5w�����	S���:4��%�������M$�D�6�K-�R����$z/�f���s�m�!�R$�)���2O�/�
�w���}b���U&�!i:�[��d�J�����"�bm%�z���B��9E�Vq����i��fP:t9�ݮ�~��rE�޺��t�)�||��I3��p�D����} ����1\e�j�SZ?
Ľ*I�<�U�Yo�fR�N���]3�:f���~�����y͹bx����۝�E��f�?{5��t�o���/m�,�z->�y��P���k�\(q��Ns7���+��*��p�m�V�W^�D�O���<p9Ai�����5PY��o�{*����tOX��E�ً*�#��"8�+�1�{��3N
5L9��b}���3>���c�WUzEm�q1&-������E�M�����-\d>�D_U�E���#Q��ϮP�p!��pE��?�brב	h�xr�Zldt)�-��`�J�����/R�)J�x���荠������o�i�΁ ��v`ȋ�j<P{��@
Z\O���)б��ey�<L����S�;{�Is�6^��b���7Z:����_��F@^z+z`�!5�5A�_N ��8�ǰ�:�]��gЅ.K���a�\�NU�_��ɕe:Ւ��U����l=��� �Iq�0� h�㦿�fUZ�0������V"�a>o]yX�B�mGK�@߁�����/�@����:N">��G�'���d�@ݞo���l?��Y_X����<&�.o���5aIA��B�Q5'�R່P�ZFO}���D?qs*�d@�&�����D��}����u��(n/��IH��c�GF��RfÉ����HHq_��,[���Ф��"ۚ�*±̣���E"+(F\��d���ZB�i���+h!����c�|�܍���1�{8�x6�)�g�F���0��?<�������L��kdb$��-�:�y�F,��b��ʂ�'��T@C�gWZ׍�
��z�q"�w���>�X�BܓE�g����;���:��4d�$n�Y�27y(��o}�~�����j��@0��tZ6�"Wϱ`_RS�AmY�zh�������L�<7�W�
�_��?�%����3��)�)Lsȗ���b�G�P���?Q�������L\5u/��I��s2q�^X�J�>�{������%�6���swڣ69�5]0-�C8��;�;<���D7q��G2ϼޯ1	d$_�;I�8
X��G5��#|�g6�0�xy�H���~'n�諻�~���_���8|;�D�GE�u���;�� �jJ}��JQ��:&��ϣ�`y,�<P� ��<���8 �����!7x�]�Os ��Q�^ u��r)jPp�BU��Ehl����=�+.+���*br����k0r�g�	�����̴
������		�8t���C���5���E��,��Mk��2�W�.��Ox����sBB('�Z�"�$�v��h��5q�&�w��R�;���+4�j-&	�#��K���m`��@�T�/*=����i��]�|F,4�b�Ob.G!3lk�"��>U.��O�I��f��%�Y�>���~��P �z�dh�����Ecn��.�j-_=@�$����Մ�7P3�����ݶ�M^�8���L=�ZS�>������6�u���M�4���2����Z�)�r�ZKE縥����qJ̯%)���8p����cҴ3��-F�<G����Z��d-��g�W�r(�3�S;)�H8�wQ���..i'��4;�4R��e%T_.�����L�����݁Ph��9Ȝ@V� Z����vg�W(�y��V�b$�� 01G��\�H%��{̏������aډ?.g��*$�����O��r����ϝ�N��d)y�O�|<�>u��n{k�����0M��%�IM���˓,1q�4�q�,s F9�+j���3���4��D�O�ċnI�k���(��	�&�e�-+�,I�;O�QؔN~Tǁ8a����vJ    �5z�(��B��CuoAk�]\0\;Z�^��F��;|t7\��f�k��C4��/:p��)�e�����t�G*)t�>����:�yT�^'!��8&��o1iW�vyٓ����Z1Ϣ7X�����Az
F�3f��I� �}���(_z״|�`Y6������65�aD�����,�m�<�&1y�A�������vP~��!T������^�鴍�c0�A�Ly�����EË�8�e�S��PW�1����Ц(�|h���C�R�Zq6���ɗ�!-��BVR��U�LV[c�w��&qR��>�Gj�S�'���`�$hހR>c�%[��H���	���œ���Ph���G|��O�������)�	t�2�zA�
�!�H�b���xC��.��~G����B����!���m���"@��7=�gET@�U��R�>�ȏq���
�I�:Q,)�ָWѵ�������'��W����y}s�5@�p�e��@(����iۡ�w ���R�4��� 	ҿj��^0-�߰�����{����7�6&�NE_�[�#fB�a|֍��ї3@u�H���W^5���w�]H�y��G�evMT�̓��M��#�%��/�^����G��i������s޽WƜ�O��9�ʻ��?�3M�_jʋ4O}	d��W�%D�b���޽��N��HJj���
��~������,���kL�Ufy����	4�E_U{,�_ �2��(E�u�%�o��'N.�[J\@h��c'�
Ō�bA�R'\y���+`1I� �c
������=�6��]���+��!J9�J��m�b�ޥ�� th���"���R���b�+G��#����ѕ��'��������n��z&IGA*���Æ��>Iؤhˠ]	u8t�;7y��fyҶIV��5�{��� x���9�l�y�}���"y�ʍ�#�21l�'��)܂V2/��%N�p�?��b�߃�
�E��'�#�f�H��J�|y}mm�d!������F����,;p��d�eT�##��Z�`�ɛ�o�?��ȳ 	��+���-��uA{a0���{�½z:X �?�?��)�@	�z&cf����7���q�\q�]��l}���^�E�؇�^���ұNyw9���
1�B̊�w��04���KAk�V���]-�	QJ?����v�������zP������d�ʘ�Hx�Yխ�[�.�5���W��ؿ�Ei��K��ٚb�O����Q�ɋ \�$�A�=�#�l�}�L�N[%��j�"�q��W[&�k��ƅ�H�o�ѕ�Gde�
k���ÄS�^�,O����!e���`gx�l��ۻ�my��8-´��[2YvA
��&	��E����_��}�qZ-�^�$���TY����e<>_@E�	�K���막�B@I�A���/�$��ǖi2{��8��]�1KVk[-K`��:��ђyk�N�x8�����+���3(	�zu�A!�7�J*Ү(��Q�,.�uo��F�d_�[�	h�gƥ�������I꒵�nr��Dc�~�?�q�Hp�*a3f��3���B��_�b��yU6-(���q�#vxVe���|�6�h�x?��ԩ�_�̗?N����7D���:��2��H�D��D@�$��aB*&��N�T�X�/��6���̺.���Ap�6v������H��vPF�#���Urלi8��.��5T)�k��Va����U4�{ܛ�B\��\�UI2�׫]V�!�u�ڧ��:�ay4v������?Hi�������Z��j��G��q�*���x;c&�~���������$}g.Ba��$�kl)���.�_(��>��~.M3g'������ԙICԺ���E�M���x�<G�3i���^��.���+�*�cՉ��ʴ]}@.Hă���NB��#����/��6�*x������K~�i�c��#�iW�:,��4z7�e�g~�
2�Ȭ>B��
��|��[��f���*;W�Y�Q�����l2�z�l7��xȶ�Ҟ?g��P�n���<��v�8�P\��Wc��>fS�Pf�-��<z��aU�����d/�c��q�ڵ7&���J]D�<���:=��:oIK��Z{�ί�0T�/�v:wY���� �eP��K���X��������m��jL�\�A@M ��=+��rEU����**l��*zCsV4�����z4� $��>WYv���87��^�&Uj���͚�3���������֏t2SE,�1�4V��F쏪Y��,�|>5T��9�왤�����e�5��f��,V���ԩ%C���'��l�'�3�#��W
��$��*%!ES���Co�o��y��y`��W�1�z�.3��g
:�������ԴH�?��  Zr;�O�	Y���
���.ߊ)_�����'�,C�V�i�Y�pDf��V��� 5K�j��evdՌ���.���뀏@�;������d�7��*ˆE�E�ZW`���=�_Ǡt�Y�9�k��X��:�H�����v��O�5�2-a��us	]�J���I�灼�����[�9�|�W6�n ִ�P�S��	&!�.���'��S�y�^�̭Y<Z;'J��U�i��Gq'$����yqh�k��;�d
�{��M�Un�d�}��6Ȧ�IgBPj{��A��p8�>1�����(����㠴�`z��=$6���������>�g�dM�^��ѭ��#�0�檖�+�(��e���Tw?�׍'p�C?��m�?�.K���чƘaBWTB!�Єg�)a��w����@�b�^@2T�l��.I� ��0l!i�pB>�G�1�W.�!__ξ4���FF�@���@�bO\���X���߃��_s'i��|���[7��yb�Dl28�6�����
���K��&�d���E��6�q� ��O;���������!�)e)H����.]����㮟?H��v!tyD�c����g/(�Ko�2v�8PE�W7D�L&�WD�=���{4���fH��t=6��5�qDk��.��k���%��<00\)�iD���S_ݠqP ��2�R�!F/`�u��/�4��U�$�|�'Ŧ���;�D���#ƕ���#���ݾ��e��u1�:�7l?
	_DZ�l%��������U_�����bT�F�D5=��q�t����m�e��F+-}����4"]���oU��h�=�+�TĪ[����WX���0 ��P���t���6�M���/s��~?���_io�C�b�i�!����~6�+$K����Ϡǟb�6�l�^ ���u=��͒$̒�8�2���~p�Y$U:�w GE?I��ߚ�iц���|z^�W�ln��X�f^�i��j�ʬ�pE�\)ی�H��Mw���^��b�-�3�Z��?U3�H���q�<��1��<���&��P*�04f��Ҁ�˻���+��0S�[} �< Ig�?�N�G�Zk%�x9��TEEXށ��'u#tʓbX����R��9�s��V�q2�9���G�>2qRC��l��:�[�+Q��Y��pƼ�J%����@tP8E��uX�4^;t�����Uq��_@XD�I0hĞ]���/I����3�_ꟁ�|�OW�~=��Ϊ��w��'C'����:�XCE��� ��sy��\T�8�����w�����0��.OB�>I��!�Zn���t��"8"t�n��C��B�	��l��Q�b�D���^���;�L R�I�a���ވ�ÑX ���<��*�v߿��(�R�>H�hg���N�K��ROUy2���_���!���;�HOJ>�ޛ�P����1��(7���d�l�Cծ��f~Ý�q�2;�E��2�b����h���*e(hh��!F���.�o��e�,�Px����Du�u�ܓl�o�����:�bx���d��n�����]|m��� �֮��v~`��J�*���]����l�`L7Ģ\�:    ��t����Yb�
��Do'���ɱ���i��p��"�����N��زv����`�y�塔q�'�����rK*�ϟ"^�s<%��7�|jZ_Tu>�Yɫ��͏�f"�K����e8y���@b�a�<���U�{g�,�$b���a_����3�\PIj�<zu|�RX��9�@�lm ~ɋ�P����C������ٻ�	����G_��E��Tm#�=(�CJ@�����7��=)}�P�r�0�N�q4m��"�,�&��<]Ͽ�EZ����I}1ɖ�m0��V����R&3���8w��LPz�U,Ao������e�̟]H77�~{������ՉĠ�~���-��7����_XU��J�!��8r��,���\�ܣ�v@��X	�� _g��V�pI^�RM�G�gI�� w���v�ʺ�[��l����Z�1�#���MD�Ȳ�_t7?W��5�	�̅1I)Vu�q�py85�ɾ����$��R�x��sZ>���ki|�1�]���f�e��@?;F�T�K��(�]:4�_�2-���L���2�a�$�x��hV5gg�pDx� ��/��he�Y�i���𢶔�_#5H�`�勤�����Q�a-[�I�ɪKEx��IZ�R�"P�C�+���X�x��{�&e<�Z�Y��u�� h��40fe=YZ��4�U��M�5D*[~����:���UY�V6�I��M@��Ww9�\���̛��[I.��XT���}Q'�%�����8�v~��R�e�X �v㞢����ꏄ漹\�.O����n��q`������Ŭ?��6P�g�����E��}:�QUi��U�;vS?6��'=A�������rM%�"������r��*�+������8�ڬ�!�u1�P0�0��@�>|M�����;�|EF[�m��4��:�/���ڵ����}�
�Ev�jo�e�hۓ��5�d��}�S/|SąK����=�Y���Ϙl�|�A���_�vÑn�E��1�\Y���.�t��ڋ�i� u:)�Y"��@���V�(����L���.Zu��aXӡ�����!�E<��v�I�,�,|�?��я�jr?<��,�<Rz|�e��JS
����eizC�J��X�˲���:6vN�m���� �)d@�����:�+�a�eI����B]�if���Id���R5Teow|#���;���`'���Qv�Y�C�W&�����XKP<մ0���W�Q�����}���� 8TVW��Y�41~��|T�Y4��R�]t��P�2��t�@�H9!��a� �i�xF���0F��+NȀŁ�6�a�7µ�;��?� =���	ZDB]�总�oث��O�V�}aj��,~hP$Y�47�:�M<�Ȋ��}���GU|!�H7�JɊ*��aT��'�<	�5_0EE=v=�˖�g^$y[��M_������H��+������u�Ap��#@|��4�o������ѓ�M�W�Վj���Nf������o���U�\�&h!+
|
�/�&-��sO_�'e��uD �5�� ]������$/\�f��U|�f�Ģ��ڒ̗�X�t4>	|,O>��&���b騫�Ya��c{��T(P�0 N ��~���J8';u��'�2����B�0�z���>Y�z
@�q�C���@��>~�X���h�� ������+{�����aQ"�E������l�Dc��%:CR&�q!.�QĶ�׻��/�Ҹ������q��]��ٞbr|1QK��)��,9���Zo0��CH��)^���9�0����<���8D���B�M���^�|�B�z������	�Ɍ�k�ϕ	�6?7�J6\ɉ�@��;8�$BԿ�?1+�jvj[
��n�7�����ތ�a�zH�@*˳�������Ԓ)�:�1��J���S4�[�B}�B��Y�Z��8����
���O�ݍ�3�Yd��#Z�4i�b���2�<��T���^�>�SM��ˢ��J�9m~_�|4Z�V��-��]��as�'�i��c'�p�m��@�v����/\�����4���4��JE) i�6� �j����n���R�,T�ֵ7<k�V�*�4y��+���st��ڞ��
v&4R��=kV�t� �"�!�!eZg!y�f��>��V?��|O���������V7C�Z_1��\������l�UD��y!��ѝ%�`���q��J4Q�� W�"K3a\��=a����#�d��lfq����8V��ۈ1�ƃ���NV >���T�J�m��@dFI�_��$4�4�b�z�a��-i�t�4��:M�4"�&S��&!:�^9h����D����S��?�d����*G�lg�x�T�enp7���qNk}�J6��x�M2����WŧУ��}�&U�ل�7O(7]_���7�����$�����2�ޯ�)����E����V�	@��4�a� �"_�O`gʄ(�{x����=�E� B�������~�[�V������d��u�
.���a�q��7%\"�cJ�lu��i�t�+��O�#lz<zAU'���� ��|�'����iS�S`�k�服�����+��._&�M�8��T�b�!D�OC��X/��\ї��Ø%el/xG�J}%�!Ʒb�lB`��Z��a��LQ[U pn��.�!p�3ta��B��r���l�4.ˠk��ˑغǇ���Ͱ���\ߤQ����F����97eKաڈ�HĚ��W�f�����b�c�s&�����Ceg|�x���R�yʹX���XT���L���,�C�6���ﲔz��(\�vs/��I{68�w���I�պQ֯��QTve��_�;���{mYߴ��&���$pb�4��H�uǹ�U\�R˨�"�_ �ʓI�f�'����l׈\�|�W��]2�1Nc�A[��uC��i��>�
��&b���"</`���i��oL���Ր���d���9w\��Ǉ�U��Cd�ū��:����?��$�]�"�R���/����^�6$B7u� z�����A˗�^/�u���S�sYi������'� A��7��)���~a%��/"UT]��?\Y��{)��L�:��d;Tʴ��FQQ�kT� µ|�����>\�˫pk�ġڋ���9��:��{���`/�H��
*�FDV�C��0PV}�ɛS�6�Ch���}w��0:�J��,�.���D;%Zb�7�H\d�A�z/Øy��"��K�^~�+�6�_Nߏe��2�^	�a�G��/������e�t����ǩKl�V&��l!Matu��3ꤋ�,!xt'<�*���QЁ�C�0=�C���r)뺞m���'�%�2�~۳�3�-�x'NN>�G�P[����>�Gz��?�-	�FD.�7l�<y� ��򫸲O�|��5��
�4SjA������Ct�R�	��J�i5�����PQ?�����$�����0����!��k�]��peڹ%t�����K�35��J�gU��<\�u�����(^�o��w�Æxr����a�X�h2:�)�b���bm���}�h�U���kps�c�T�1/�����IM\p�e,��|���,�!��X\��h�&�aMS��h�P����C����3�KJ҈͊̆��k^U����e��I�,�o�r�(���v��+Y�0.�o��|�S��h\:��iYg�U�e���9��_VX6��&��b�ˬ���l~�[�g5��*����Zevc�'��@x�%~ky�_B4�!�]�����op�ٛq�&3$��\~�P��-�oQ�I`��u$�Q��G(�� �4���:�	̈́x2Q���)�+����:ht�.2�6�3�d�m�.�n"���> r�?}��3A�� >�姸:\:�=(�/��kTq�:YA�?�Rtd!��^�+����#�J��C曈䆎�,    �,`M�$�$ں�{�X�v� .VX7IU�pP�ؕvժ4�@;�8��Ni�ohg�a�����d��f�5��?UH=L0�R
F=^��%T\@}������J�ڡB�H��_"�C���ap���KےTy�fu@]�NY������ַf����)�b�+W��y(˔�u�^A̧Q�2���u������:����z��"�W�N�J*X�ԁ����Ӟ��G�yD�d2����Z"�z8C��a�A��$���XFo��f/8�у��<aH���롹�7 �ּH�!`��g�.���UR�At���7�h>54$Ƅ:\�T���8ԧ,0�W��+f6h�6������R8����
���@4U�$\UG�����u��>z>癳��d�¬�z;fs���~
_|T2��E{Í��/�r�C¾Yx*�kM�� ��!�JM������po�蓼�!nU���8�t���z�_lf뛩���{��ʼ�\Dj��Q�+�x=�P�yv�u}U����m�
�/捦�p:�^�K�!�5{�L0�P�`�9y�Q��qJ?Т��R�q_��A'� �0D��}�N"`��9xy�'g��[���0�^o�ս��>���7�47B�� ��n�E��4�	W�B ��4]��MJ��j��G�'�
��c_��E F ��u��a}V� ��2���l�[��>hs$��h�B?�åX>vӵE^�/%q?��O��◾�0�3D��x�o��ꪮ�@}�3��~&��p�~lz�=Rv��&���PF{9��m�	E ���!(M\v��B�����f�P~�&��}��M�V�e�|
�[}�3L� �h�9���l�6m��m���(��0�q\Z�R�W�r�D��tә~��ҡ��މI�	L$!M�K��R5M#7L��{F���� j\ޗ󋞺,��Z躌�:c�i��7E�ʇ@oy�ԍkB�U�(S@a�+^��n�a}ñ�㉄\W�?�z�D��c�ÚbN��#"���m��fVw.������R �g�� +T��W�^(��Ɣ�F�s�򝋊6�r�������E_����0�+1$��7,Ah�,H1�������n�F���c��8�j��)�
�@���0DN4j�l"�o��(g�z���uC}Ý��:�.]�#<gz��0\�&h@����&O��u��^ j��f_̭p��I��2�K�?E×h�N�$$�X�QOn.���o a���W������ϏWX�|G �0ϭ��[}��˫�Zģ�-�x��/?yuպɚ�q*'�X�Ga�0��i�Ԁ<�k@W�z��-���/���2B��Φ[��_0ۢ|�@t>�Q������
��.�nh�:iH��Ɇ����Ԁ��w�r���x�4^|{���;�w��T�n�<\� �D7a�{�����������=T}�7�^�J8�FZA��eB��U>N ��X�u.β�Y����h@ @�G�E
�3ᩊ�ɸ	>p8|=k�$�|s�¿��0?�%�sa����OY����B�ܭ^���$��r�*��T���x�O�l�R)_��WE�m{�K0�Fn��=͕˯��|]͞����t��Q�čor.4�R�R@O= V�Π���PQ����Z�G:���"9���U��O�e6����2����2��5��F�QT-͉�u:?!T�D�7/'��xn{V�&E�O��ֶKg�A��:��=.�J�&
��Yn�9���/�O)}�_(,���� fn���OZ7�yM�_XƉ]�,��C��ʹGjwOGt*���!����&+䌭*CJ����y�sNɺ;|V����CQ����4I]�,�i��QQH�$aLo!�t�˾P����Bezu3%
�b�����c����_7�pC��)�y���/�+�`:=\ى��BGs�E����C�w�-�2��2�c,v׊�k��dC#`��,�M�\$s�mHk��R�C
�����*��u-�oD=P[�Y}����p`�RB��+����_�Y����L��y�VF���h�#�S&����[�4�
h�&c�n�d�F��?��Ϟ����N��W��W]�����k�߬����Д/�"�ݺ�_˥�/�Ù��ý�h��G�'�l6�� ��p�J��_@��OP�;��h����P\7�!�"������B�o����Rc8��G�}�	dC���f��V}������d��m���t
qy���o��3U�Wt/�����ɔ��G����_c;�t�e��"✼�:;����%R���9�Q4�6�+̮r�d���g���f��arDW�0���ًљ��V�5�1 Q�T��!�_�8�/��ܺNn���2v�?	���	)�b}&�w����֜4Q��������g2C[����C�j���%r�f|���w���R
zS��XӡBj���2o�E)k^@�7tm]����
��e�D�vP��<Ŵ�	��%	������B�L�C���g�H�6�4���-��^����J�92e}�<.���ST�I�Dq�K��� g��S������g�3�uQ�E�|��"K�9�"��]�R���mZ��?ʎ�t����x�u�s#�S�8��H��������e���2ɅϮ��W�S��+qN�:�<�@�rhi���-���X7EV�_�d�tExH�[G��<x|�601�ۆZN4�T���+��3�X�xP��P�z��j$��/j�L�3�-8���]X
��@�i��Q���M��f�YUR,^d��WY���]�*���*���+w��F��X�||�M	gQ���["�KU;��+���2S�+Dw�j�z͆����U^�7��D�~s� ���x�`��0  C'�g��B����qQ�j�b����W�7��(:_Ȅ��W2n����U�3��W]7΢�MV��<6#�Ms��,�W�mS��g��]�ڦ)���{-���nirF�l�d(a QPP)�x�{w����®�%�"�uՂl�~��l�h�z�IJh������(����x�����.su��i�Y�8�b��c�}T&#D�F!���=������+���i}�F��q7��h;,&�b���GXٺ5�*�&f�}h|W��♾�x��$�p�*WU����7��h,`_"������Ҍ�BC�aO���LD�ͭh݉J.q�e8����>��ؖ_T'U�t7��������p��W�,�Q��d؍*e�W��\���`�6���q��-��S&���P��$��_iH$�?AVk�U�uX���I�vb� �P���p#�mA��Oe��e���-�K�8��*z�6L#b�}�KYN6J�N�n���>�÷��zJ�4~8,T?���dM�1�	��	��'��p��3;#��ҡD���j
<&[H� L��d:�W��3[�W�q,� ��&�Y5x1Z�Q	ּ�sg2k��X��,��6C�����o;ˮ�c����x��2\���!ʬ4�X��џ#��3��xZ�éҾa��#�E�5���mڴ�x.��3E��珎˪,�'��\�DSo���6cb���/t5�э��~�H!���[�:�_�*��Z�en��2�����8�����%�Ξ��X�u�����ҕux�"H���4�IY�3�t������o���y�"0J3��;{��b�7C51[eYR���c\SU4mÅ��zm6�W>ԡd)��=��0�ߒf���o�"/�p��m �3=	��b���s��Hv�i𡣴���F��%SdY#������4���ۭ���j��P�Un��2ˡ�C��f'KHe�)��	'�0X���/9�V�jo�H6�����-3W��6��m�ɔY�A��`�� �bl�R�RDe� �2���/���]���y�2}����V���/c�Q�^�U���fewy=���}o�]Y}�������r ��X�! ��w    yZ��,_�.��%��IL$�'Ѫ+�� �ߤ�����e�!��9g�*־¬\rCΩ�2	��Eb�Dx���C��/֖�.�HCV��J�=��bE���#V/�z��o�su���R
[T�;=�A��tLq:�r�*��I�٠J{�ܕ�f������g�H�2/���⬮�+BL��w��sM��f7�0���Zň��vyxE�#��D}߿
^V��Np��b��V��T��m�f�b�r��V�2î���q��FG¨>_YV⠘����^�[		n84}�s������g�:�W�Ҭr��sT��-bgcb�oD`�P8l����j_�# <�߄@E!�R�,���h�3��H��F�դ���S��b��W^����]��av���kًb�����.P+�)S��|u6k�Zg��"2`���0P0���G�y�V����: "�,��'�X�l�3���i�+�*+Bq��	' ��Qh�+l��{�ŀD�A(���)��[�oG�z�U1S@���Wp�iv��SA 蛷m���ގr��oxU}rY	a��!�W���?���!{��C
��]2��k*�@l����#�Nj�<=e©��E�,@m�AW��߅.~@Z%�f 뙙���&�˂v�?tG�o��t��"�x�[�2	P�<��0B�ǿ	`����)8\��&���];B$�1{+�"O����.�2�sx?��AG���v��>�Ga*�6<>�/�\U��-K�ڮ
���f�PB�娻՟ �q�����<��b��b��lh��U�.���ٜYsA�
��Q�n~��C���/l��P�r�|�
C��;�xy&1��,<�j֞�΃�}�͐Lp�$�?����c�2��Z
B��A��_��o���Av�H��E���u���G��P�+&W��\k��-ӕy���hHpq��?�/����0qwI���1Y��7U��=�-�Y�z�+��)�Rd�2m�}`��bwf'+G���]����.�� �4����,��#֋�_�/��ϸ&�wJfL���Edf9�NS�J4\�һx�^�7Yuñ,��D}��o4FIoW*�9��Ỿ��t�v�J���ު kn��wE0�ׯD��n���WI�n�������0�"����u�p��S0�U}B�՘����1X9����؜E��lD�#T����|hKU乛j���S`s�(��9� ��C�G�F��<��-�p<���Ν�^���/����k��c�,�~������ת��t~X��4uҲ(��H3�F"h�����6�����!�ID(_��j�,�G(��P�e�z|�L��>�>)� ���A��곍0/ L��nSWa�[T�L�޶����S4���g�-�AŃ��xY�8e�kʈ 8˪/x���X�>�N�!�5t�,�u�Q�a��,j�3$;�5y�j��:o�j��ř�C��Oa񉵰sA��'~j�.-���D���O]�/���e�g����e}�K�B�ۦ}�2���.Xm�����ت�dqt�|��z�ճ%�|�*��ۍ+�����y�n0y�م�\<�g-��6�X/��⾪��:-�c�,����9��G�e!��=���}q�/��}qJ�:n��+R�Q%����5�U}ia�n��������ԃ��Z��BG�8��@K�$�z\h�u������4[WN�v�ה��6�دǇ�p
B/D���@$�W����+
?i\@/� ]���D��o�M %�#�(����4:D�C�a>b>�x���c]�;4X9�Mo{{� h�MA�W�q��ҫ�a��@${����Q0�\[�取]^'��r��+��C�G�}i1ʘ�x`�!:2$3�
m��|@|�������7O�<�y]YH�y>>�+��o&�W�Oi ���>|>���yȔ�m�}�m��/B�Δ7���/ +���o4����++��.�[\}����䝠F���a@�!z-�sU{Cq�g.���2}x�nv��=�W�K{\7���.�A썰4z�t��_�1g��842�_3@��!.��?�6mow�E<qh�:"c�o���<`�sґ����������x8(�E��T���I@�����HY-���}s� ��$P�JJ�� ��{��O���T��A�j���H���Ԣ�P;��#��ye�#���q�MZ���6.wu�XW���Qb����2��Vo�(����)�h.&����1*A��\�U7�0�����U���o�Iu. �7��O>W����������V��H���>���4A��Ç����)����[����ұJ#�P����2�F�BEF������}8������غ@+~L(�EVT � �Ѹ*)����p������nvC6P��Z��/ϟ�F�Iq��8��N֘U��Mp�VM�/*s-�<���q�V��zu�=Z��xA�� �~%��A��$�T��9GMWe���̦�V�����^�EpI�܉�7���Ǣ��z~�RTq�[�R��.�G��8kQ��+�����W,�!��n!���kO��ZK��S1�41m�6�SV�Y�Y}�t�Q���	�FiV0��6vR�.��\~�����7#e���{�����G�����@�C����ϐM"|�5� �	�,}FU-
�}�·I�iQ��E�7�j
����tD�I�-ĸ�(%j�_�к9����c�$ª^���m�!���h�:����%�פ\�����j5UEl� �u���f�@8�_��t�X|r�	=n����wmm����&��if3�:�ޚ��HvS�6�)�k}��P/����O�|'?�:Kj{�4�	2q\������o)�UFV��I��TE���uِ��7�URǥ%�:��������k_������#W�X6���zˍ�L]:���4u!^y�O��8
i�H�FS�
� L�&*�T��*�ӠuWв�4 ��J�������3�c�z�a?�߃��'Ym ��wo-����i�*�*h��e�P ��OE�%�{��-U�ب�9|2�N�#�@H!z��k��smw���4�7�:z��rC;R3�w_�qV�4�RP��퍪�Ȏ#l�����}�e]_u}~CD����X*�2�PW�8�})T�X�K�֎�l0����u�!k�W������BGݲ�j�)�fAۊ�|z�	;���F$���X��V��X��T'�İpI��Y�����YA�7�q���D����T<��^~��Uv�N���<�;_�z�xЛ���0j�\թ\�)���6�,_��/}1zC��8�,�EB�A�����ق{)�%��j"�T�]�/D��Q�̵< &��*p.]>X���}��.r�n.��_-��P���f��Ҿ1ʖ?m���jo��t�mg�J�J�+�RѪ�x����gl����D��j�_�!�������@�+�?} �(�*0F����H��O��!����oz�e��h�BW,����(�<\V�̓\����g�:*\]��Ņ�d�-���de���-�[�|��!dy�&6�tu��Q| )1�:5@�~�ӟ3����� ���P��˲4��4��P����U�ݠ)����ֶ:�6�;|o �V/�
>�f�IN���G̙�.�������S�A�{"iC]�ewC0����������.�>�!|h%0���-�M���&�|%M�m����
klsA��ʝ��{c���k�ꆣYY�Z4��Y8�ܝ�74�>�W�P�:#*�����]�����b������}�P����>�J�,VqAENei��֍�ZbL�&E+*�E����a�����d�W��7��eel��*΢O�2fD6Q7ب�]\�L�A��� j�n���B��$Su.�5]>&`ݖ�܋��,^��D�2�Բ%6,�ҹ�Va���������G�����G�:"��L��"    ��z����s��b=|F���aF�hO>��A����R�������n�0=�����o�O��F�,�e{����F�+!aQ���+�N_���3���]���w3�ͫo8BX$�!*"���F2?��2�Rs�����I2�ߘ�:#�􂣹�nn���u<;zI��.��e��Oagq�	-���L�0n�d����и�� ��\D�X~M���/��G*I����}�f��	�/��m�����q�m
&�#::��2�E�$R	���"���9�9�!��f��
����f�>��:��t3�I:���h�� �����-_�ڿ�]:��ظ�T���1����;S��q���=��w�﨨 P�Tsn���7�W����u��!�ee���Q�1��@:�����I�s~�����]�[��9>�������'��.O��^�ݗ�� ��f}0[�צ��?R��x�7����lꚧ>bl�L~Z���Z���?r]����]�[�"����a�2���a�A�$�G�Uq״s�?�����^%ٕzG�6u���=�R�D0�AON�xnb�]��o>��Ņ=�I.]���q�AR����7��L��({��n3��@,��5b�D ���7`������:	W��r�P�+%��9���E���p�������:�~�HM@��@�A�y3��$��v�cPo�F���|H���/�<��k���g���X�C�x�Y�!`��ܵ�y@?���n�pA��� �	Dn$�_���Y~JK2_g���YU��E���_��+�޻՟@�g��=>��,��@�]�Z���N&E�^�6_C$�%pW�n';K}+��Y3ܹ̻ zo�'��ݭ�?<DW��QUg����6�c4��x��?L�W�,��uHZ�im�0�Q��	܈�3��枌�?��NS������1_T3m9���.R&�'����{�Ӯ�����̰�U�Eo'�Yn���R��[1�@k�KF�>\�M�t��J�8�_��EVV��S�$;_���rjC����DڍI��`�]w�׹��LP{B�Ń}6og˗�&�Up���7��8�\a���+�%��%ա<ҟ��n	�=�������=U�D��v�Q��B|��fpLb�'3y��pޅzv�/z�Q��_|��]��G�<���Q�d����7�r濠(a����p��%�):*"X�l�,��Qkx�h�E�a(=<�8b�.�߱n[�8�B�n��/һaB
��#i�?�#��}Ċ���+Ǧ3MNB]�6�O(�>HG�;$��Ä�C��MZ�ѭ�2l��4�&����4��}s���I�/��T��~�tRh�<���C��XCa �M^@���Y=��ea��*͢/;���WM����p�a�� ��a�o�~���NT��i=R�h/�B�<��W�$-�p8�H��r���ڄz�F�	m��W1ʖ�Ӥ��Mu�e��>���^C��rJ|D�\-~��[�*����C�P�G^���S��<�Gsb���ըA,��},�����ð=��x��y<��{�5��>94��r�uO�����:n(�E��>��6n&}%��\ɣ��B�L��=^1�|�~
��)�Z������+
{B��ZrG/G��ǖ�������+槏��Ķ8��ڇ� &uV������낁���a��|��*��8���2f}6�/3��3� �|�xi�vєӄ{��%z��+�75y�r"q�SS��Q�M�
ިQ-9q͕[��OY�-�$G��}�P��qӠ��]�n���{�%Y^���Y�ʐM��O����s��?���]'D	DE
քz�M�ڗ���$�BX�A�jD�4_�k���/��Z�&"�1L����<_�HV#�.����}M��"%��j0OC���?�]D*�t5�"��^��tHM�H���Ŀ�qi��C�֏JU��t~b���ܙ� P�Vd�6��
����oE WT��&�pJ�$��,El�	yc�,z����mh�ѫ�����g��7�<��auܘ��Wv� ���.?=�"Fp^�N�_䴞���E�qFG���0J���>Hk��_uBy�Ɲ~X�=��K�MT��qF���+�̕]rÉ��"��Y�@� ��f<��70��I�u&�r�oy��Q���D���ɚ�,�Ìr���
�,����~܎�"E~���*�M�\K%CS��z�.Zz�x��%���Uy����p�gU�heY����x�v�@<JD�d˷��?N�V��WQ�E�b�Qw>���Y��6G�X�bb�X�l����C����Z��O���Vƹ3������8���Y��R:c\���Q��Y��G�%��ѫ|���ˊ"@���_8��V|/^�/�! ��T�]D�b�IQ �(m�dRX�L�e����p~�86>��/U����K��,��ڵ�������@p�4�9ƨ��Q�NQ�O8ީ�^������^�a�����Y��µ7�ue�&a(���J�n}��ɓ�K�r�,�W��o�'Ú��u+BV-��e��7���E(H\�Yd͂l{Cq��K�n�Bz�NK�G��k�!^⫱B�|7]_���v���ty ��qD%�3i������"�W&�"ɋ����]{��.�Ī8�C�'�7u~�9�;�\C���?�p6�� �m��)�U�6Y7Z_%Im�LU�Fo�A�T�����QK�܎��J�G��_����?��O��0��-L�+�<��c�|HWѧ���&�7��p��"y.ն��I]X\���;���f�{���G��DCB��*��j�B��xnyU�-��*uUnS�<Wj&�V�!cx@�P�Z�_c���}a��(��<�/��(c�ܰ��`�c�s^D��m��)�giݟ�wCQ֮���g�=cH��Z�W���\������H�2�2�8r�,~,�]Y�F$�wb?��I����y���V�}�7�u��5�OhK9�%� ��I����k^V��|}��a[�SmU��-�#���#��W�� �nܸt�>ȥ�_k�c`O�ŀ\g�Ҷ�@��O�6��ʱ#���d����2.o�7Tu��6��]���s4��Em� 8���n�����HAt����6˺�I6=��g�� }��u����Nu �Û�!-���ę�W���0�5����9����2o��}�\��X >Eg�����!?�zZ�Oa���r��E|�9�MlϿ��߄��G�uI��@��︟�� NA�j+���*���G��.�q�(D j�+��z�#�yd�ެϦ߄�_Ė+�5�qb�@�˯w�ƥ���%y1%�2��x��7�IX���0N��ط~$Ρ�v?h�LO*�V�����l8����W�!�U��a�	��n�S9���:��;�N�Z���L���P�\.�j�Ym~�:���I-\�IuCQⲸXQG�)do��:�;V��ύ?� �b�z���B��ă	 ���{����if�n�J�W���*\��
�d��|K������W1j���|e�ń ��@ܪ�u��L\QUΆOe���2�`C�Ё\o}�S�����~�vg�I4AL���:ڨ� �8�S��[\�izKL]�'�!�ğD��*��Z����o+�����t�U����$K����[�u�^p[�+��'�&�dd�4���t|�!����a�b����¹�O��C��3Y~�Qu<���s�F��B�HD\I����	� ��*4x�h��z��j�Nd�&A"��P��� ��ɋ������K�>�3�!�E\�ac<�dy��3fTe����%>)4�WVv�,����랧�0�t�2�Ԫp?>߰���yP����Ar�oZ�V�b��z;_��%O��`O�� P@���% @��9[A�W9���uHʪc�����{�C����+p���-`텡9Y��W��P}�>��fu�!��|l��2���^�" ��׽#�_�'KV1)������+_������Ӡ    ���ݛ�8��b/d�n���i�F� ��[������K9�-�Gp-`���F���q�_ 
�U]�ο�I\L ����:�q�~��Q)M�h�Dt��/�]�f��|t�Bt@��)@���`uӄ$X'R:��uдm�>$
˜٠q��骖���t�pC�\]���Eo�]��u��ÅʒF��c��� �BAިT�(��JrC�ʩ����wz+m �>�0�l
��y�UE�����M�[�}m�n�f�˂�SE�>n�f2�-�W������ҵ��G��לּ���X%*�r�P��f*��Qla�7S�@-,�."`�:�]D���?ڈ��Eo�s�uy}�����D��E
��[��u��Ou��eRږ;�jDP�h ��\�/ ���u2�SK7�<�df���Q�y�M�o�U�T�<� �@���s��D+��叧�8Kn�e�B�V)�`�UR�|��V��o���Bc���`�'|~��$C�A˗/ �fI��p��s���>����ު��M�6B��P��Z��VkD=�ؽ�NѸ!v�����6�ַ�FW�PWU����㕋6ʭ>�VX�]0�6�W��ς3�[�l���a<0��8�MZ��+�,K��wUu��r��@����7�`-g�S�Z��m]����y�8����aܹ�%=��P�M�J�k�"_��ܛd'M�ETd��?�W�Ϧ��.� �U!���K���a�!���V���/�Cd_�`v)����j�$� ���H,TX�mf���[~�ܮ]��/2Ȩ��%�g<���:�@�L�V�;Q�hۣ��������/�d]'�Y����i�-
�5�W�4P�6O���	Z7f���$�/Ӻ�_�7D��ePD��H�ĳ ���9=��w�V�I�C���c�j]U���<M\�y��(�)[�ez�4���2�-_^��Ek3��y:��"����]��&-��	�g�[�Q�0s��[Ҭ���7]W�go~�$&u	���os6�LH�N�������@U�^@�Sv�%��a]`\�=!�����>���6?����!�U>�1$M���So���glK�0�ݭ^A`G�-Z�TU1�D-����WY���E����kP��<Pm����纫��(4I��^��V�u��}T_�U;�`Y�"�^? �;J�m��.]x�|)\Wd@���B�^�t4�m'��������V}���"�(|miG_y=w׊ۦz��=Ճ`�Og��B�-���-�����@�qI�Z'>r�ޛ�%�EhL�À��mA�k�Uo���SVQ��@⢾a�S�I$=]�!���C��W�z5�C����4��o(� u"�T����-�ә~�K��d������*�"#��hbP�w��YBxk�m6;U)}���?6�",T���h5�?%��������a-y�މ�Ǖy�#�zW�sWH�}s2Yv�Z��k���ۊ��z0,�	|&H����7�͵���+;������S
�[Äc��F�`b¸�OC��)����
�Ώ#t`�C;[U��oa74∆�ͽ�u'{e�r�V��G�-���x�~mqD5pM,<O�K�������,񝼝�<�'<�w��fW��{e1C&�
,�u�.�aPq�d���DC4�;�Ӄ�l���kPLN����x/m0��|���:^�����U�$qe4ufǱ�A4n����ʢ���E�2;t='E�xc؇mLy��*���\ M{e-s�����?���__��
Οb�s���#Ej![}Ҹ���`B�?��:�W� ���Fgk��bZ�"=_�6g&3����!8�,�s|��_�Y*�DC�5P��pl�+�
�F4k&K��姵u���p�ytY�c]k�
�i���<���)�{?��8�(����ӡ�;3������]Y�ГTy��`�����`��&]�(�C�,��/�!�TL��^��j��,fUTEPds�W�O ��D��?0g�gƵ���&pa���"��u�)!�"���w�u�T�l�A�bS`�����^�Z�lh�ٓJ����h([�pn��GgE:�o���7� %�Gt�43DM�����X�÷�ߔW؊��+]�[�󧴣Å>��$?��j����:K��b�F����=��7�2�KÈ���%F'x��D�)&2�=Qa-c�X"���׭�.��ٯ.���Pfx�?�<UƭD4�?"�y�F��35) \D��Ss샙�Vά���\g������ �w�9=��ZP�[�6�t�A�E�|��*�bj}O�Z��j����=U�7�;��/etG؏Ә����?Ӌ��5q>��\b�eS�+ԟ�Ǹ�~�|3w������[4�l��悙L�Nge�O���Knၜ����v�͠��E�r�$q~��8�q��F�NҢ��%�b�������D�F�#|�  �J]�jSQ��$�.� d�7(�����϶K �c!+@sdM��ox>�����/��tТ�~C�(>܋���I��n�QZ1�XE���x<�G��U����ٻ���"��<)���ǉ����U�u���tM��._�N����nP�U$^���]8B�'XVp�&��t��:�L���A�#~˗7���u7T@.�ʪ��dE��I�{1���u�	{�����O��Z�A#`�Ax��[�:�������KC�|�G_�+ߜ3p�'��o�(������$�ި�qQ��TH�s�j&`t`���Z<X�N��u�g��Sa��8ҡ�8��8���B���P���|�iDE�0��[A��:N���K3�r��0z�O`��D�KTs�E�B-�m��a^�qJ�.�-҅Z�'��4�"""����=t�� ��@q$�DY�8���E��s���y/���V9~'���?�
ޓ#����	M��CV4%���x��$Љؗ0B!x�������Ԓ��[��5��3��#�{�����_ le!T�b��I9E�t�<�1��k(ps������,W�͚��$�m4Y�	[�C,��Ҕ]�RΙи�#����������P����p��L�Uv l5��:bq~��P�a��_<&�N���o�K'��N��wL8���ߜ��0���{$�Ɖ��v�W� �-���Ҹ(���J�*��G�џ��@1QMZ.��V��'���^��1��5A��W�<�I���/�\1�იVy�a}��������(Ul�U��vq"�f�Fk>nC�vx��*����otVMu�	�P�Xt�N��Hu�����[�?i�k~�"��.�l��r�s��J�ِ.�"I���(���{�����H�`vi�����p:�Z��Dњ�i���UV7n�!lT巰����+�]�]�D�@H�@4OaĪ�iP0�Re��O2@'9���Q�u֯���\�r�(i}���h9W�gn�o���.&@ו�H|]d���i���������t���x/��g
n|-��M��o���@?�V,©|u标�0�a���_���|��P���5IM�k��b���	�<�d��9��؜;� �|Ru`0��F5��mb�"�GP�Ie��}	?v��e8ø�=]ju"=�J��+�9�Kz����o�	�Ԩ��\, �������|Wu9���_+{kR�BsV�̬�"7>��g�S�8:���t�BI�s���ft�\�a�=π,>ƽ� ���
0�Vb��F���&(M���-�ק��EA��iK	ߓ��D;�$����B���Uo5-4�j,�w蠻��QE-(�E����F�"���m��+}�e�D���^���^vl��M�%|2��M��@�Y�խ��a��C�Y~b͓���?R�҅�
�6'D��?E�U��.X��t�0/柧�|/!��,]��D�W�h��!d�LOp�a�}�h��
'��	�0�9�˷|�󪍫f~���,B��菋 �Eb`�IR��w�]���a#��Hu|��oE�&-��C��UF���|_��k�Bq�0��}o�`)�    �M�lD�R��hA*����RM^~g^���a�ǫBkZ��*GQҘ`�O1�A��Ŭ�u����f���|Q�v<R��Z�}�q��m�3
���|c!1Y��Zs��~<��@���LZ.-R$y��?�Y���\ZG 8x@c�5')z�:�F?YK�Wv�8��*'+]c���.Eѕ�+&��:�ݰ��mP
�����@�/�8c6��&t^�4�ľ"����w|��$�����qQ��F
YL{5�cI�`����j��ta�_�����?��qt��y6���|aJru�D_!G��Խ����cX�Ѡ�/��w�����_���4��څ�����@�3(y�����"O�
�X+����8(N�����Oa1��!V��!���X�:Y��"�gp�|t
�ڇx��O�������t��ΣP_0��c4�5����	é�pnǵ�[G������xͲ2)��Bt/�a��N7�⍼#�|9���o�4���3�&�)u��G6��>�fR,��;�
�~���7yO���3�<�]�!�rv�a�~�?|k��4�'e/����?8͉̑�I�^�i��^�K�<\�<��{<�0@�8UwRt�N>���RTa��$k������t �(�DDI��G����$˖�J�����uum���辄�B|Ŗ�r�v#\�U[b��t�Q��zI���bʺ]�+��*�4����l�AK/�������x�1�VlSA_�`M7�+�o��
kC�G32@T�����qUzCT몬BT�����Qﳷ���[�wY�|ZH��yyC�sEYئ<�Q��yk�cj?θ���A{Ea�-
�L9(J���T��q;�[��zZ#�9����j��QT �M )���W�C_��q|ER�Kp���ۑ�391}���_*ڀ�)��)t�I�\54)�8�U컬NR
k�\M��Y�sHd~w�"�Ӄ /��?���t���c	�FsEi��m��W5��x��B��؟�n/=�����]����_������;���ʑ�:T�? ������G,wh�qO�M�s4�d��i��0`�Ies@#��{0V���6�h~62�U������oLbͽ
�$ .ۀJ�N��.`UB\�������UZ���B������9�F������5��'��x�u�}��8(�JU�Qc��"�,^ �
IYݐ���6gѤ�`��9�ʅ�����*�o�5"8��q���Y���?s��{2�ш:m~��o��whF�}�t?@O��E��dAz��T�X�޳�?��ĉ��+��A�u�1�#����s�]:�%�������@�D�}�7��DƠ��y�z)�ސzإ��^v��ʸ���� ���k����R����P�˟XU����ޢ�]({�ܨ0�������k	w>�M[�����k
[x��IϢ��˖�6T��n�8u��$g�C����e�d��!����Oؼ��w��J�e�,Q��.Y
�AQ��`UWmZ�7�JW�&HY�?�t9s�'��J<�'<�aK�,�k���8\�����Q-"MO=�fF�S�ᓁ\&�U 9���P��^���
�q��|���5,)�\���{�4�h�?*L�f5HM�f�(�<1��&�ה)�xz�RV��ߊn5�3�7xz@0��m��ȹ�4|A<��$�rTa�i.�z3%۠s�}*ȭ�m�o��!?U�a�ܿL�IE!��`��J��;A�c��J�.r�.���`���B�#����D�%t&'���"Ԣ`��87�����N|�+��Q�Q�;��2�4@���-�-����TC�v����џ>��L��`��
{�\������@P6N@��������/�'�������@f�I�[2�Ju��Q�A�=
y̭ �e���jna��Z��P���[C������t!YK��vvW�� �h�_�:��O	�&���D
"�|�d������Y,�A�\�4��c���z(Ab��p5��A��f��ʼ!G��,�s,��C�(�ѿ�w+�ꂓ���*�ڨӫ��_Pֽ/��URՁES$ѧ�t�,u?�:� �SY/�u��~]��KVi�T��,��)��d��-us>��6���acÈ�$�9����V��e�NY��Yy��w]�q��˩��H�t1]���eC���KTE��}�G�07�Md3����~���An��`ΰ����{_ �5�����Hp�]��=�]`���		���[��� ���LU��T�h���`��c���Pڱ����=Q7��O��}�i�>p��z�캷Ը�? ��R?=PL�mu�9n�~�k՝��7�kSgr�]k�-����~h�\U��uEq-�~v�r�F�����9���%Z����u<W�S���nJ�rP�m�#��Y�+��1��a�L����]	�y�K|�lOТ*��O\UV��۠�N�2��
g:P��]����eMГ*��_�����G�N�d�.��6�F����ӏ�pَ
BT��w�np���:u��(}��'nH>�"�M�0QRK!�^~���q�οV@,��]��m�i�a�ۖ��H�T��*q2UAE��cr���h���"�/uҸ2����a������@S��2|9ܢ0�L�V_T�H���F:mPj������g��>���$�]���U�������&״����E�H��9��?��^S��
ˉ9� �v�DT�8݃2�M(����$���Hq��9�sθ���V��Ia��q+l7�'~ԷGqs�߬��a?������|j����{� <����H1�؜D��)Vu�l�ſ�j�x=�l�2��W���l��g��驦E����7���qh����*��Y�VW�odilVlf��Wn6��Jx�s��/��٬�>�?$ty�vN�G� ����׿�b�tr�Vo���x}w��}c�خ xI�p�m����q���6)��@�V/5���{E� ��� �o�'�����ҕ�P^�ћqoaf��kt}���t�&��s']8�.����>����P-cQQ�ײb�d���q���wψ��#�\p*���=Y�rI���_��m6k�#��q�@���x/c�+�=�/�)Pi�KH����2�ITx�eB^�W���:��PϏ^V.�/'6�ݠ�3��̚�bQ/^��B�c��.�e��R�Q@�t�J�bAo�
�z�E��"a�5&�KP8�doJ��	c�u{��*�4�=H5�7��R���Ӄ�D頊��W�(ǥ�P-O|2�ߋtU��f��p��r�ZT����7e��Xj0��춆�F����sV׺f6:�K�,5̺�"B���{n~��_�|�uLܦe�@չ�\������t�3�nݴ���q\ZaV��?ُ��"i
�wX��т&~�u������/�s����E ����>��l~ZK���!�щ��`�g�<�����(F�N�'w�}ӚƩ�.>�-����R��ǌOn�=h��}�X�tjUF���deN /�8j��M��������>�*e6�a�,��V�V
�J��7��.��V���t&�?X�EPq ���ҋ��|��}�6�?��5!=9n���t��}�:�j�����h������Flh���m�0ʞ%
�Η��ˆ�?��U���DGG�3QF��[�[�K�d(��*OK�.I��,O�����&Ry��)���Qx��㵺��*��{[��z�H�G�NsS�vI�;*0�n�΃&D�u\�\he�9���K?����K�߲�Y�770UY窊t��m���A&�5�w+H^��Q�J$4�A@�
W��GloD�j%��҂�
D~`Ha(���w	�fM�@6�i~,�r���QE9��ʣ��쎛V��Ϲ��3?�O�HN\ۍ��T���o�s��ʈ�ޚVe��AD'Q/�^	���_�V�߳�J� �M�U�;f�Gd������    6�\�|!�>w.�?�J���U���eC�C�����UZ��_]}=b	A,��8�/��k��d��.M�zj_]�mnu��>��q�#��ܓ2��L4���o�������e��E����wL���>_c��W:���w	r�hVԠ���@d,�Ih�����u�^�e��l���8�:��LX��@��JRL�Ui��dq�W�2�zu�p�����w��?��mE7�p���,-��i$N5"���N0j@�	���
i�#KXP��ԽْG�%��_�����[M$�@�D��kf"³cA2�믝���N˭w��L[� �f��Y�i�jsJڐS��A������O�=���26��T���@O-m�$�*
2��������J'��e1}�����\�5w�ީ��I�]�#&�+U�V��Z��C����(^��w�B�]k�
KC�А_z��+�\��)F��Ъ�(�7��&������\wC�ַOh�,-|�[&������N:`���GE&x&�z������}X����t��IW���q5�[�'~޸���^���@���D �,�8e��0\��M�����r�L�?���043Nb��^ߪ̂w�3�(���G���G���cTa]���.�`��}9���k��u'���ȼ}z�I�D���{�+uu@��-J�}���uu�d����E���]m$ԧћ�]����c7�tHs�Y���`�8��]�E��rIꒃOe0����1Y�?l��l�	���!���e���.����IV��TYVM;U��+���ĕj}��5�//����А�];�*�үӪ0�	��)R���q��8^��t�,�-3���D�9�������̿���Ɛve:�VIR顊�����[�q^�@�	��\�B�S�	�e�,��*Y��/�7Y�~O�(,��n���	���HL�����/p��]��$�6��r܅''��*	~�(�������x�$28�UI��3��]5k�߮Me|�a�J9�SYz��|!������.n�9�-��_UH	�/�#��/O Ul H ]�v��*��<�����|�vh�@z�<�,K�,�*S��j�Q��$�K5ؿQ�u[���1U����¼���G�Y���S側����9���?����1Z����r�9��}�V�e^��rfqTL�H�$�8�)r�*J�����H]�h�$i�@�U�)��߻5�N��>�G,�o �U֥�X�%U��{�4��\#� ��&Oq�ܯ*��4��s�y�A�U�V��M�\##*�������� ^qg1��ʻ�+w����C�:�C���H)�<��\��ʲ'^V]M��R��$af�M����=�(�f&�I�7"���FREi�63��Sl�.'6	�St��5ԯ&K�B��&�G�c ��]^m�t��}R�m�����3D�e�O$0'T$�	��SɰZ��&�{������S�����:��'������o3��I���;��yTV�$�&TЪ_�#���]j����#���|'S\cC�;���j�#����8,���v"/��P=U�f6�Hnh;���;��8�"ޮ��=ԔY�C���_�Vq�#��-c�0>ʝ)����\<Dr~�Q���= ���$��(Ù�^#�u	�A�&w�D�E4]���o�)��"mf�2�,�����3[�Ǐ�5�����'�=*yO���X��"jg���8	��~�6�o�)_f*'��k���p(D�ڟ	2�EV3�Ȅ��=����R�Z�����\�H�|�� �Nl�U��jxڊ]�M���U}��gO���&+�rFgU$y�*8~%DEx���?o��tc� 6�q��aP�H5C�Șa��\�D�ռ=G��/�c|�:lT����'�� ���`M��.o�l���e�-�4xG��+�r�]f���4�[�#����϶�$M����*�DW`)�xq?A2���$9�IO����� �z�Kser�gE�L�e���IIU���Vf�e�y��9�SJA�[Ŷ��Ё��=�Wd��lGl��f����䓣'�X�ej{y+���2���c��с\�(��5�q�/g����x�F3�&~=�_��+�b��g��pqƨ����Fq�1i7������7�T�TGh n~%���qq�w��`O0�����}#�r����{�0p�*��\�#y�f�UR&�۝�#�d��٣" ]����ì��G|�fºϕ%�����Фچw8���<i��6�=��,�ٴ�Q��P\%�i�4E�к,S�@��%��A��;$me3�<	}n��72�U*� K,�8]�_��ȐC��`v�w��sPYR؋*�*�dQ-��^[ܽWt�+?��j����o�c׬��=��-u_Hq�S��ӥs/.I��/@��V���*�ɥ�.�Z�~�����Hi�O�R4���<RȰGC��ɪ��O��ű���_ݑ��}+�?7�g� +{�LP=�W��7Pwm�>4/��4?�*�O��C��F�2����7���U�?:pĿ�pH��Ȳ��̇+
>�U1�)ן!�'�y�}r�P�A|�2U�aq�D�
��pU?��A={c��QEWH��Ge�=�L����w��*��۳f�ineF�?��_<Q�� �����%�A��e�<U,�Q|����,���Q�M��3NW�ʪ8~'�
��,S%ᚒe��ܿ�x��I8Y�E���P-���+��,��yl[8��I��-�mR�DN4�@�B���/ZӮ)g�"��<�k)�/4dP��%�ә��+w��퉺��!x�I�Wv�ހU7����A��>`E��,# ���<%r;�7>a�����tK�_CK)- �o5����ϊ����*�������&y[?���������A��$կy���&�A��&��q���=Hy��cA��O|��_6�Q�iT8�����)��G*/0R���������tF�%�<�v=������_��nN6o7����>�#�� �HVw�a{DWL�p�lp���V�h��猾k�n�d�j��m�'�!�'uq���Zڷ��[�՚��ɽ^��V�0�|�	:�i�h� �E+nh2��H�e�
��\����T��a܍�{va�6-����=��*��ޕv;�"�bx�3��wOb��v(���Ȫ�v�d��#cEWʙ���'$tu�i8Q�e*y�������F�G�p��P��E4$��
��Е�jv,�^,4=��Q˴����g~�$� ��<�G�#�T@���Ͷc.�Q�VT&q���#�GǴڄE&�U�܏;��ܽ8���8�wX��&�
oK¾F��cZ�Ej�$�m|{)ř��$0G����Łγ6�+��4�Y�hMx]�*����\��2���$5��hp�2��APu���vMՌ�sm���<|�.G>I­W�5��ު�lCt|��#��_4�mRT���*�I=-Ƀ���qʤ�7��ԫ8�B��p��Z!��2��;@����P&�S!���5=�r��AsR�&���>,,}�����"=����\̈́���)x�T�Z���W�i�5T+(��~#J����.<�'�y=F~g�Bڳ���OPk�z��صp�,�͢�������tӨ���b����}�ʵO���i,�,����a�pUR�
�z_檂M�˚X�|��y�SW�A �R��k|��p%���~O��s}���z?���
���L�����k�)R�k�-����ӈ��+��׺v�ʷ��9?���A�F�����{�*�>��]dȎ٫F�����Eọ�-�#�9��Mn�Fҧk�嬆�b��Ӗ����Hú���c�:�����r�I'8�`ǟkΐyU}�zT������ڏn๊/I�Bw�_Tp��"��7㼎g�n�:G���*o&��(�u�[`;��W�+�ɌO� }�Ģ����7v_�ܿ�4�p	�nc-쏢�*f���:�?��}��C��_    ������j檕����*~�%7:W�5�D�4���C] �Z��o��r�.шgt�������u�f���A�Ueay�%�����(���A��}Vɱ�|���0S*�(l���RY։����T��Jq���J�M4�
��]��lD*��}�A��Rh�(��!Ej��cR� O8P���J��(��VeK�S�&*4���������J�w�AO"m�?���$C�h�K��]��*��j�d��u+�W@����Y+�ƺ�e�a�Y��9��B����, ��4\�	E+�h?�nR�1�[{��i�U�c�����=0!��X�M\u�7s�n����� ݈J ���g�>����@\�Ebӿ4>�#�צ�s2H������Ⱥj[����B>��J�[��mh�#�$t�[b����^FbB�~��q��C(w� Ѿ������ˬi��X�&a�+�ԣ�iyz�Y�����	�d���Mg *Ŏy���	v�]r�̭��[�$/��S6�+^X�b*��1$���cd$4 ��h�K�<�x�q$�K�Ot7��qG|_H�:���-��Az!}�?Mk,�K��ЛXl}��!>�(`��E��
�$E�&1;�	�u�$����d0�Vf]j���H���}�vi�:����o��`�s�2�O�vf�WO �i�^�G1�PwYwq8�ynz�U��[���:�|%�o�M�7`�Q�i^θ�0��$-ɓj�q�5h.�d6��t2%�C���'Ȍ� ,���ܳ�zG� �g�5��/�oAaWG��d�p�ތ��ET���t]F��~�����‼�)����ծA<=��n����]��ktU�����u�s����5���%O:��Z�ž{8�]�g��qH)��k���O�<H��n�˫7�v�S�|�k��`D��G�4��~��<���	<Y��O����:uø2p&��c�
�$��I��E���%��H�KopKT��dm�(��/����.��{���������iiǴ��݊�S��0 �,���jy��be�R��]�}2�Q^����@��Ӟ{o5z��/dy��Mc�9��b�?���;��awQ���4U����{дȼrv�E�w�R���� ��_Nۖ�C��(�Z���O@-i^�^OJ<��9»�v�u�qE���m��P�/`��w��ی%�0��ѷӶT���)�&	?}��s���H-���or��@����W6mzxx� /F0��sW=���h~����3x8�9v.������W�U��Ì<\�Qa�`UA� H�����V7$�/M�1.;1jǹ1W߾#}!���V5}]�3�X�f�ZeI��H(fmՀ�K;������>���)Wܒl_����^|����ݺ<}�"W�T!K�_��&XyQ0���	��??�/;�+��lk�׸�?�"7t��M��nY���+}���*����x�r5��� *4��m�}n����3�[�4���W${��i�lϓ��]��c�Ę<���iV�D������#�
�--Ѿ���t��2��|DY�<��Y ��T��a�����X��p���{��^���sb:�[p���:
��YU���慛�e7Yvq��^H���
�h�Ʀ!8�|P�'F>\1�l9+yH�3���q��yv�.&K��ù�<�	s�COTꋸ�����ei�~T�j$Yv�=s]'Q:�ع/푒Y���U�F�������_�#����I���p`V��de�K�οv�P^=�����R��n�L9�b#�B 嘵^���тq�Q�?X���"�̤mh�U�'$<�O3�b�����7���+g���P�j�>In��ŴL�CwK� �$�y��*̡��=>ˆ��q.S����M�q>#D�Eb"�<���D��)�C��D�A,�������	����GM���cU�^F7�HQ�۪�T�`�YZ:�����|0@s_��e�H�6]�G� 
��X�$�	s7���_�{2�Ȗ#+��66�Q�H���~�Ĭ�<uV9^^�Jjw�eS����m�:�n/܊$+B����D��x\jFyiU�O@M��t=�u�����2Z�\�3͒���%�4�B�Ռ�Q���,�������e��@=�[�>�@�J]��n��S��3�P�z�__B�$ِ�zj�|�����$+� �C3O�{��c��ۃj�Դ��*�4���u�b��=`�!m7��p2(��z��a�=�-�5Q�S�+�u���E!+��MS�|~���'(%�t�JA�
߲�U�t��d�FU��I����4���st�����1�.AiA{�)F*"l%Zk��&���B�	^Ə�vO#�D����y�V~3��L��:��ty��AJO�l7E�������=4-��_H�yW���=�/���{<��a��[,f[���vJ[Q�B�?zE��m�V�#-�:���^���c.���D_�?!�"[���Ыը��Ad$HR�^͑����=� ��S@5w���4��VX�x��l߭�}R{r���]�I�\��U���4;jG�ők�OBr�����K�=i^�p�����m7%�ɒ�B��jf��md�@K>����#Qp����x�w^BM'�x'�S��eQ�>�/�Ļ�TyL��^ҏ_z	^�zP��3��W��T���6E��~�K�y	��
~�pN�z1�2F���+t5y]��jfJ����Y��n�XKKm��� �ͭ�OS��s�k8�� ����:���-h	2�ۡ����)6��Q-�]�p9�U��۱I��Y5#�u�wk" i���8r��{5�H�P�Y��=�#�p��/ø����Ѵm^�������^��r��4�%�V�bW��������� ��{�Vmߧ��q\�#UD���WΝ�2��������[I�	�3�� I`�j ��\\���*�
P�3�W�
�����"����ꗙ�}�����4���8�kI��z}�<��x'�<P�e%(��De�G|i�0�zv ����0I�y R��((T,Ď.3�k��UՔE�Z��ӫ˨{�qU��'�/T!ƚ��q�,hI ��0��������D���ف+�co�UĮ�E�@��Ǻ�.�A>?S��u�=����%t���E�ϻ�����	�4L��˼�ʳP}��o���V~��L�e���]����f�b�4/r�,��p!�[A���$ո�Vl����ɆJ�R� �wy4e-�x����X�.͊��UP���W�(2 �(��h�^ߖk�A�z��e�m)�� <l�`����T՘_u� y�w�q�b7:o�lFx�4�}x��-n��=��ߤ�P�����]9��a�+ɶ�#L����6�+�ig����IE�C��W3?�t��˵���w�/<6i�3 
0|�
 g�("��B�/��Wt�ʺfd�rr�)J����?�+�cPN篍ô)�'׮��#�*�˩���+�A$�)�׫�(N��Rs���[����#:��y6 A����M�)		�Y���յY�kzӓ��u������B�7�Q�M!�H'jQ~|M8��L{y��D�����&�V���>I�~F@�<�cZF��_�/�~��l}��Ç��A�2?l�6({[%!º(l�MJ%)j��f�_?��)�@ohv)�K&4F�\8�tv��L��֡'��/J�q/�[���/6M_��?�8�򤜌���jD��&;*΋��B�&�P�ə������O󼹽,���e��1�y`�nުʑ���`Cn��(��¸��p�>d�
O�)q?�s�;	���r������ڡ6$�W|����蓛a�(C�$�9^���g�UCO�4>�ۘ�^Mp�. R� �w��߾H#��Y��v�dN.����������ս��K���CM���Y�WI7�%�G2�O��2`��H��j�KC{7�|��jG�Fw�Y��C��UB�q�#�����꬛q�"���Bܫ&EC�    �˙Fh2c2Xڼ!���2#r)��J$czt[��w�~۞e(�*�-% �S4W�>�p�G�_��F5�i��:�#bd\cTq�:��!�Kio�8�4�
	��B)e�=���?���]�N���[P8�d6Jʾ��'��*�?��q�|�-N\��xb�q밚,����v��_"K�$d�H gl�i8M�<����*���\�����U2���4u_��5P��<(ٙY��=Y�^�,w���qT�x�w��I���!����[�8����Pfi�MQ�*��nX,�7�͢��B�'�a�ljD���ϱm/P����cC�Ɍ�W�qj��$ܼB&�NX��G㸙\g��ɂZ�ȤQ;��ly����P6Y?#�WE��VU�͠��%#	@��'SQel�y�7o6���U���I��t��8sjZ��_\U;�<p��0�2��U��3�e�?5���R%9�=l~�ʪ�$��/�a ,ݽK*����7 !6�}:��G3Nc/jP�&p�Q9��Y�~lE� 3�_��n��rޢ5(+�$��7��4n"�$.�c��f���j��!�������'G���?ju�t�xi�c(c�ʂ�Y�^�I�������t�@a��%��H�=��a��UeH��Z��X�w����v�Y��*�(VE��Yg|"�h�=�d��E�[��/��J���*��IB>:O����dC���L��#����������8A������㸛�w�����B�)"�I��#�@ck�|���{z^k�vj���3�Yt���.���M�'�^2�' Ge������r����e	�r�h�_�|�R�j�ImREp*�Y��.k���S��E�+��VWioE�:����>�s���u�W�0#:iy BUo�{�<�}�oY3��M����?.���+�)�PB��nr�}�X�2t��z�#x 층m(��E8f��\G�:�{���:)������¢2͑(�n���)�lFX2>�ড�b��ذA:}�O���=o��$Z�\czb-&��e2���/\�q�~�{r�'�7Q��2L�@�!ѳ�;���T�t��\дJ`�^�D�VH��GzҤ���:a<���i�y��@� FW�h&�l6+�����a�[jK�]� ��N����V�"���?�;.�aT��л�����n'�z��V4��e_}^�>�j���M�z����I��U˲")��o1zw�Mv��H}~�X��d���o�~�s��u3�^�fy[;��P��(O�<����@�^&ME]�R�?6<n�	������gW�Qe�/�R��a��	�۸��E����YVTi���,�A��1��=�Ձ��GA�ֹ�ä��EB��a{�,-+��B�Ԫ��z'FZT�"���$�W=���xx�5"&���LI��5�ּ�l-7�8o�!]$�i;�3�Ze�)�O=K���ڴ�m�/�`���Ik���?�����@g���i�u��C~���Yi�S�y�����^ku?_NO����*���Ɩ�(ra�7p+(�����wD��HyV.��M^����Q6�)c>��+B�P�6�=�f�<��Og���(Ȃ]w
w{�;FeH%b�r��UH�A�Z��Y�vW�0���Yaj�Qxojj��q�-B�����OPd&�D;N��b����MU��m�h$Ӵ��(��O_��E�	Lu��F�RxX��y�˳wu9�ݷ�S���� ���T���V�:���9�m�Ƿ��4���)������$�]���D� ��h(�f�nA��s�+�UI��j-F��e�H��vM���4KC[�EI��8�p�pL���b��@@5�T�v�tt���җ4����;+��6�f��<�#��Gi@� ���F��|���<*��a�/��.��po8��5���Kn�-!eZ$��l��"3-���������Ex�W����}�b���K� �^���%�D�~?�],����Go|�����_\� r��֐��T
32)���-Ei�GH
�Wc��n+z\�{/2���gq ���*� 9�{<��]8��i��Ӌ��o�}w�*�|@�&�n��4�(���Y�Q.G�u?l�R��De �u�5{�������T��˸�=^��u�θ�E�+�<���hf�@Q�k5*[ў(��g�-Q�W:8���y����n��ub���yG]�/�rfQe3�^Q����E�����}�$�-�Xv/�+�AP��k��o��2#��YX�/*���Wun���^,�V]+�xI.��q`VSE���i��$���UX��XU��c�\�R�=`��ttW�z?�1F�H��L0(���j�wݒe��4�~F��� cq�b�Q[\���=�To���OV��7�pQ_��E�,s����oPƮ�� E���v'�Eʭ�����	���g��Ox��D�zp�jc�2�r���6gĬL�V��"�/9�FP6�D�����<$O�@
����ZӨ�z��H���qI�-n�$0_*����>��,,'UJD�~������7��c�ȇCk]��8�k���;������ϓ�S�G��9^ ~�5��t�.�`�mߎ©�񽀄�d�	�{��p�X�e��>)\)�kug���Вs�qW��i&"��O�?�΢>g�G
�����X����*�d�U`ǵ	UUP� u������8|�t]�
���n���T2z���7O��S	R�Ϳ�ӊ�	�8��4>�JK�X�\�l�1�Ͻ=Lܰ?�J@T�9X|�v;�e��&�ŬS�@<��G)]����´��EH������������p#K[�TN��¨'S�i=Y�t��")T�����y�3�E�VV$�9�F^�����]o�>�_w�����8���8O����~)ø2����Ș�>,2�
K}ŵ��d�\�9>�3z�]	fD�̀(]��j��6a^���>�f�5�
W���鈆7�*^�w��>��RԠxT�=C�bR4���C��D���A���ȥ��_�|�R�o��e�g�擄�'E�k&�T"�)�)�w�I���|@m��_���ʓ��x��ë�\\���T��5�����
�25PP�ӡ�	ك�ą�Fq 5�>�=�p�ޖ�������ee<cKTEif"5I��Fj��^eP�K�zv~���B����}���Nf�/�"$��,I���"��rMy;ج�[�'�_S��
�b'۸��yx
��.���_]�b��'E��Ռ�����B��~�k�X���.^A����dU��D9��,uӻ�z�*���v4����
~ <�ܗ�z��_��z����5�U�"Q��d��x3.�SlsZ�����F(G	ݩ.�Z�sF�n���|"$c������v#R�E�2`��*���ɔJ:��a�]��� t'x��r�]3��*-�X�$<	�j\ �SgZ�fȦ���d���b3��i��U�����<��;7U��(�O�U��j�4U���Kk��V<,8+Z��o�Uye:N���״�g�`�E#�q�#�m��$��v1^�|]����x���m�F�@��O'�9 K�?������Q®��Џ&�Z��rx�bH�9G��4¤
��	�x7j)Uw�Q�ª�Q��#UI0j�[�ٝ�	��X>�Y+W[��}/2V/ákoo�*�+��.�_�\1@
1�|�������<p��HW�k�<��H�㫬-��p��2���֐�ى
{��(Pa��	��l(������>����h���eF7�p#0U�����w�q-Hr_mq���\�Q=�$�U�̢=c���o�L�G
YU���ֈ�.��j�����"!Β2��H*��I�U��NNV���)ƞGq5�� ��֫O�S\i���29��
�W���o	�L����1��<�n�̺��If��4~�OJ"Tҏ�3��Y�oH�#ڊ|�]��uzA��KT̿�W��=�-,�͖@Z��چ�m�7K��Ѓ+*�Y����Ā��j~�p���N3x�ۺ��F�~R�vE���tĊJ�(�r�\-����eY�    7wdmU��I���)G�:ԑ�ƗMO�6=���e��m�@3�)^��\�NSq8i�]L��n�:#Yd����#<Ӵ��2-A����{?�{T�3W�����zJI�ot[�_I�a(�y4�h�f$�,�l,���{����)����#�/�g�d�m�a��7�2)�冂 ��;s�48R��k����5��v�I�ò}�=�9^�G/Z$�6qߒU�jp���zx�*��e�vh�pF����_pF��_c��l
oJs��J�[r^l/ �V�?7.�n��S����V8Y||+]\�VAg�Qt���ފo�r%E���E|-��r��*ʛ9��*R+\2�$��I�:A�����D(j>�~5���Y�E2��Ea�(/K���)�?/}~D����>w��֍��)q�������r���E3^m��X����
o��(m��X����s����x:��ZTQ<�R���`RB��.��v=�t9fJ �0���'@�-�J�6Ngĵ��K�����m;�\��Iy��g�}*�$�߾@:?KW���]�"�*��fƹ��<���?�w�2�˅���R��-Mɗ�������x���N����`PU��3�1Qb.=Y|�n���h�O<�72{;�)* h%����,���sdf;!e�)�,_m��k���qV�8�i��vg��_��4y��ȁ�ή�V�_�AwR��I�W\�܇@��5	~g�'NՁ�]8W[�,xB�/ngE�dښU���4y8��~H:�k�5�<�=��Ry�q�%��s���Ͻ��6f�̬���0� �<�D 4��n��1��A���X�l���n|��� T�Z*o�j���z��M����#��ʔo��7�DՃP��Վkۢ|<�p���.���|�4��*Pչ�?�N)
�7����T.�Y����\<���$^#SiA�$��;&�&=�������F&ɣ��rO��Z�ɹ,�4��hu7���Պ��%)��	�6�ԩ��_6���=��\�����`��ly1�F��_��8,���l�8jG�STb���<_޳�%��,ioϤq�#��0���e��Ŷ}:���BԊӹ�i�J����l�۷ߺN�nƔ)���?�"��Pj/���5H,���0G��3KoZ�B���r��:����!S�d�O�e�N�b�&1F<;��,W��������'_{��ё�Yч3k}	]p���T�E�F3�m��]�*���/�,_HAV���e«��p�i��[Uwt�*��羊���2$��UЄY���4h����pR��л���70_�����}���(����*#���)wiѐz��/�X�ѵ�~���P���ZN��n����"
ͽ����Ox��R�pQQ,D���r��gb`����cu�'��;�jR�!)��mo�-�e��^8��#�3��Ds��\Aoo��r�)V�B���׽;E3�вJ*�i &j�zH�$HX�#"��$��ME�,��N�����#��/l�gpa�F����0�^�����P�;*XyY�IЋ����剛��g�I�>G�P�<�(֓^=r�X?��"r�T�����y�<�#1ڋ�Ob�-�R��&o����W���+����7��K���0�����"�aw�]zS�Ռ���U�+R�(��!�ʍ_��Nn�rqM0��n���\�����.`�z�hh�EVEa{{�K�"����1sx��2S��C�h��e���R+��?�	�]�?��?���?�~�>��_V��"�D�z�9�������0��zgj���`�TW#D��>l>�or��X����$��<��tt*l�bN��qi<�2
��ZmU�P��ȉ���m���>\��L�L ���2���x���ގ�]�A/�����j5�r��-�6��*����]tݽ���(�IKG�tv(�ǋLD��R�@ C.�<�i�	��q���2)�����,�LSP�J�;�!�q@�2y�I;SP���Yn��a<�kp-��h�)l����Y@�u�U��D�H�|�Ї���D�������c�a�p`�q����@�ɸ��-�xV������(�(6A��d7��G�K�ߺ�J^s��^N*�ۻ��}����JLF�����q�b!��Wߧ���/���B�Z���o�;E(���xyn�z$)���A3bR[�XX������Ν�N�~�]�y=m�!�B�	HU��@���t��&�C�v e�Ŏ��O��^wV{<�<)��[W>�����p���Y��J���/$z]	Rl;-Xi���*��q!��o��nO,�J��U��kї]�7"���1�kG4t\��J�����O��X��n[u�:m�e������,�O_�J����I0i�
%Ow@w�^���Hop�)���������������ܹ�&�wa��M�l�b?Mb/�S��B?�Z��t+�ឺ�j�ޡ-�j�#;,6go�~�@&M���e�=�`��K�b�gg��O�_wjEp����>Q멦L�@�:��n�	=
��{���Fqgk��G�h�8�	"s�'蒠&��dG�$� �Z��G�6ݗ3�3�A��R�����چb��_rh_�� \i��C�(��"W)�:|NPQp�gk��غoӄ@
�s��y)� !.Q��;ܹ��#mq����moKm�)�s���OO(�T}ݩ_���êX���ߎ/I�4L�5~w���ɽ��R��O�=K�ss���B��s|�����!�Xs�Va>��N�86��*
�У����3���:t1�uۉz�C���-�c�!�\���簞6�b��Κ�ٴm$Q��$�����tf����]������6p��T��)Zm�XT�2ƶ)���'�E[����^d�"4De.A�%˩'DXV$�B��B=z2l�7�(w�����Am߿�o�Y}{2�@PPJ���nW.��BA�pt�]
��A���f���یe�I}�Y-�wD�B��5�x{]y{���aUZX���a�hNs�͕
\�R��͊�,t�bY��qqJW�ŋ���$Ͳ9q�J�`Wy�3S*�/z,�P�V�ýj�Ed��T�giA\��c�/�htY�$3FQi��E��3�ҫd�Z�!r�ÇOB��摛���v!_m0���˛���e��dU­q�"'�E<�܏_��l���PW����?O�B[��
��d���r�r�J�s���.g���U��M�\�\���@5�� r˵�]�3��"s�Ϭ(�@9��o��%8{�鈒�w��e�KL�.n�?�=u��̹te~�(�D	�}�Rg�4Q�0�ވ�1�jW�_M11Q?�e�ىB�������:�7/գ�%A�5�?����Oa� �f�#
&�@��K�-W�>�?�'�d(��$4���+��()9�Z�Z��t�IM�����~G^+��
YŮ��]@O�5��-�����8�;*�+�U�r�`�O��+�Ҫ6�+ţL4���̆����܋h��O)
�����'-ŕ��*gdت�� ��R i�{N{�G�(�(��q��2���kJ`���ݿtBFyq{�
���,	~ƍ�;w�B�#�Mm�g��c²1��=`?�d��Ƚ�̩{L�ph�(������]� �+d���
����	�+(y���rM��*6�GD����7��B鯁����yDL��t��*���=�6�@�6��v�XT�|J�:�bL�b--�6���o�����]����	T0�s�∞���6,�o��-��G�3f2���)��]��]��GY4C5 w-Zb&�a
��VA�Ú�i}F�w`�@�^f�ƛxw	��Z�e��i��3bV���Y�<���t%&R�z�1��(\L��I���/t�����M�8��^ �ހ}S9d�#�aMK�TPa������ �^@�W�#��Ӭ�f�6��בE�+�j�7Px��N�&8d܍_�����a�WΈPi��QX��gs� 
���,�^��b�"^3
�D�t������ޝ���y��Yla3�5z�)�E$v��Q��ZĤ�Q��1m�8    [A����ͣ.��F.ly�f�}�����2Ci��Q��8w�d�����'B��������=ci�إ	��\fYR��ӽ��/뺝�*N�鋢�(6�?1M��S��=<a_��ЯX����a�3/�8������%qS��u�wK���I{(����V�WE��w��C�Ӆ�=:8�`S��Y�{ڷ�
�N�;�iNW`>�� �D�5������~��4�:���-��{�8=�����XX�� N�\=��7Y0��Ĉd�I�1����g� =�؆w�{4׹���
�~������R'����8�5�k�8L`�5��#��h^z�s�����M���g ��2N���t��iFw�����GZr�c��E�}� W��M��l~ú\���P��,�o�7M��3X�-�+��U��$}����G�xc� ��#<bv��wb'��C�j�o��9$�|���d�R�>�������ɉŐjz1*���F�Y���dŃbYɈ���g�\�&��q�ʃ�\-R���ɴa�"��O�8���)�+����	7�Ub�����3	�e���Z4������K1���o�ճ{!G��\?���oX玘�ؖ�T;��ʶq}�<��M��N�o䊗!�}�WY��G!��0�Mp���������¹��q�c
.=��+���s�'��{�2��6]��\�>�wM��^=�ߥV�Gy���xG�#_W�����?l�AEN�C�% 1��^k\�D��k����:��+����� 5�*K-^;�FTM�P�&�N�xh!���b@�Ր�=��$V�/.f��U3\DYh��QT?]Nn�_�B�'�N]5s�Û�q��ۉ۞^kmE!����C�f3��"�cCRGta�ѰpW����t��V��
�YF�X~Q��ꢟx����7	��h-��a�F�h�<Y�4D�0C���K����'h��D�W:�=���������R7!���\\�p�*<!|Z��6�CX�s�ZL�a��p���{�Bs��(�>�J6���W����啮�����hΘ$�Lz��Zm`��d̐T�p���HC���q�է��'�z}8�p�gY�s���'�I�\)y��ox��,�\㫾$��Q�����)�vg8�#�$xL�0�
a�k@��sY�� B��#��l��G0+Bc�Fq��kV��'��:�EhL��=x{�>!��]�垲��ft�EF��J���I���r��<��7=�jX�Ц;!x�̟�%�ߍ�����E晿xy��u~k�	;]w!��|���P7���,���p穇$a]�+��8�/
�����p	Q��NBM��ˌ�V]Q���>
��E�^k���yp�E2#�U\��_\��G�y�M�!�k� &����V[�/WڶU������'�I`\SK*]��܆5���k�.'��``J��מ�pCuG�_��<)��L����m�l�U݌��{���J�ࣶW^��W�[��B|��>~�0��E#r�h�^?�	�"�AI*�2�}�"���	#���D��^��\��l��R=I�[�Պե��0����2�r#�GI(�ȊQ��#�ח�ߋJ��őYh�M\�@m�$�	!���=T�}5c�\�8(��3�����Qn���Н��
|��}�f�6��$�w���'�䂃�9��(�]�%@�Bť�����u�ju���@�I� �����~DEw쇝(��r@ 4�׍��J.'٤�j�E��g�~�?�=M�IO_�����O؄i�3n�Ueg8	�^p��,��jZ${�zM]�u`����G"C�W�{�J�8��"�">5a�a=#�U���$~���J�\�BJ�.�\���6�{.�й�5�%�O\Jp6�lL��WXm¼-�'4/���L��`��8_����*l�Ã#~׉*��j�܂�N��YeF���y�q&h��@�����y���#��_UL�o U��m瑾E?��W?
jHb#����,x��!*n�tVaX�N9)���׫gP/5s�{V��#��N�*w�udO�Bn�P�O��^oT�@X�F7aUY9#�E�s[?���OMzA�����4���Xz���SM����<'|`w��j�>�g��(�M�#J��w�?�t�g�I�R�$^���-���'QN3i����9�����^�jR��m�p��
�U�B_���߼����ShS���HZW5]!mbH��N��-��z�^�� �^����>��k��,-��Q@�a׻��|KdgW�zj�}$ *}�Z.��6p�࿰�ʚ��jyi)PY�I[�^l�\�>J��-fA!�Tz���>o]��K-2V�Vm⅏��=��(q�`e�ﰕrz���^nQd�����o.�z����	�(�~FΪ���\�4����V�&�`����`���g��t��zy|D#��!gOT����(O���!w��ad-_��k���	�E����{�ʩ���������3�n�l��O������]Mye��g��J�cx��,|�pݍ�h\H9P�[�A<{��o�VJ�+���V+]�b�4Q��3�pU{��(-�����lAzP��G�oOJ�!��~�8ps����ZJ񭉪��1�����`Fi	!+��g�ArE�1 ]�;�S�Y�OtKv���CYq��pMԔ�͝~�ă4�ʵj5aє}T��b!���3�����z��m���j���hE��XmE��� j���!�B�ڊ�0x/,w�d���<�_��B�C�>�2�� �E��W���T6P�`"a``��.��}�v�^��6?B����gU�����;��O���s9���	:^�}Tq�n{n�WL�?��|��0��]�ɉ�G�]�2�Bu�s$�]�ՐW�醂��v*h��z��I��	B�
Crr��u�����di���N�$����95����y�%�b�qM�y��~��,3�(��7r P�w�z�|�F`��~q.��[�Z�Yj��D}��l��,l�Y�3l�`E�7��SXt &��H��Y%��������כe�P.���&�f<�qU��T�PƊ�f�9QTDV�F�R�[ۮ��bO]���m��?��|�yQ[���Oh�����U�}Uŷץ����L�U�$C����;�D]�bA����tF[C�M������6�8@���&�4�M�e-1��#u�^x�8��L*�Q@�Qg/Y��c�\���2JfT�Y6i/eWf��F��E���N�?h�aG*d�f{V���|O~ :���Zh}�����G���_yճ�)�������G�O�<_���^s����c.�_�+.�p��YUl]؍/�dB�R}��f���}Ü zr�_�:�%;���pE�A��d�{O�|��Q�M
N,�?	�0A�u�I'j�"�Q�M���旯z�q�����k�/��h���?�E m+c��uȢ�����C�H�{	7&�L�>C���d�����q9D�ײ
�3`,1�?m�/�I\M���$��}dN����bQM���� ���ST��l�Q�D��l�H�wox��͐��푈�ܓ:s���+�2���R5s�q����W&�J0I� ���� 
q��Ì��ӌ4��(�\�L�@���u���xi����➠���]�;.��	�����/������n/R�$Is{��8xcC�Sf�ԋ��$B����"D�jS��Z�$l�9�2�*�p̓��ͷ�jI�n&�*4��*���a�Ʃ���|�ڂAD&Q\o���h qH=#����mr���E�<�ָv4�H ����+L�CR�	b�B��k)��&I�p�g���+�r"���j�˴q�;�� �+ y�]I()�`�A����l�H��L��]͒n�*6I����"t�4~u���^���/q)Vk1Sl��Dh=�w�e"�箫��*�鼘��^*��4Yf�B�E�H~4=��5L��?��j�9?7I�4�SU����Ћ唟�S��7�    ������*�m�[;���?�����	\�o�G��
���#װ�B�'� �߼D?�16sm�ۚ���ڌ���љf�.��g]�8�hCO"'�Ϣӧӥ��Z�:m��|�'�{T�&�ݞ.p_i'/�������~w^�N���z���	X�SL@hZ`�OS���d|]*�yg{J�n9yCv	�<L���4?:(!o>�إVc>mzQ����J��颬y��o 6�j~�"�0I�&��w5����I�V��;�8��Ԟ�"pH���;.+J�ϱ�p���@��	�WrO�[u�
�M�Yv>#nU�qW�k�@����'�4s���.!Y:?�^/	�H �e�\����_	�"��h��5��'�8*�&�������$��X��g����2
��5z^ۭ���cN������x�;m�<�sJO����),�L�>�n����$�1Ka�3Д2{/}dڪR=�4;.V[�-ƃo�!m�e�O<�"~�D�w���ݼ�'ZAx�ǵf3Q���W�,Z�d�:����gd"�zVބ��rM�q�'�^`B�%reC�h�l)�����r���*C�	�c��7��#_{N����z ې�4s�U�&�m>\��0]+�mj4��G��p1���*��δ,�U��2��?�K�w@}IH�)��9��D�����.gFY-]��iL�l���S�� �b�qM�i��1N��KY�FO�~�X|������"]�����I�s��}� Q\k�ko9�f�q�(΢,�oB��$Q����D�.� ;�5t]��+	{#���4��Pt��{ORO@�Ov�l�jt��=�˺�g�u�u�;.�E9���4���^���$ۃ��w��0(?A[�s�۾_d��4^�8�9f�2���~�ɇ�Y̙q]k��B��aF/��v(��!�M�>�U��zQ�Uԩh���n0��l 1]�Lqc�n �'�B�1��
�[��_l��Q1�(��8����a@!ѓ����J
,Զ}�Jg�����jU^�Ǔ[J��I�*�gt�UMъ�S>�+��4ׁX���?��ކ��b��v`)�`ZE���I��8����E�^l�U�
J��(ɱƸ�˸�o
M'���~�}5��˂`@p�MϢ�I�Xp�!�$e�FQ5՛%��&.�s/s%���#����22i]Ϲ�G�P�G{���`�:r�fw_�\�;�tw8j�����	�S7� �����l����d&�Zq_)�~��j�'=��Tg � �k�7?�j�iE>�?DL~;�y�PqX��;�A8��j���F©� 3�IX�Q-�$���E{@�dZ6M�ٿ2Ru`�c���?�-�ae���M9��D·��8�W�B��42U�����g��$�Y�
ExZH6�O��<�LЏ�$�D 8���B�n��:��7uU���g�Z��QG����j��x���R
�Mڄq~{jM��}r�W��^����6/"q~��˨��7��ެLȚ����c^n���Q��_f��Yf�o�]��L>:�7>��R?^�U�^$P=�'�X�>YL�#��d�)��2��Tp�3a���I�3$�o.mk*IIT�s|�Ih�Tۜ����y���b�i�V݌"&���� %�V�	oD)�=�PeRŁ�/i��C��D��=
ܛ6�����>-v1긄�n���b��3�$��_�2�A"š�ʢ�_7�͑[�����d�?�ʼ��IR�@w�~Zp&Gg*����XYF���?[V�?�Q'�*�+Tls���ƕ�8��������~~�,��p�g�-&db^/f	�PWӈ]l������>�I���QVRpjGO^n���C���e����y+�R�ӛ���Q�᧦A�P��R��Qկ�j��q�;��r��g��(x�5ã�S�.���zbѲ�	M��ޞM��a�+�se��PW�d�+�E����"�m�?�;��mѢ�����LN��i�Vxs��@g�T������H���'�k����	�g5[}�|GP�'3m*��m�&:�˸�������d�/� D��rʲZ��7�-�,��ms��
���L~�����$M25�+����ҴNo_�&EZ��Pq �n���Y�OW:�϶o��܃d�avv��HGecլ�eP1�=�^i%qO���ɲ�ngT�eR�DU�6��I������ޔ϶��d�S��x]��/�S}y����#��WN4&?�zD�u1���H����J�e����I.@���x)v�m�^P���Q>/�r�[��*].5��P��4L��0�U�����ck��o�w"���]�esiG����@�Qg��kão����?⺞N�b+w�Ӽ�WW�����zJ�3�h��S���+�P�1���/�X꺨n��(����*��2ފLx��'���#3e �p��`."B�t�$�>_b�L	�w�hh�����Sf`~���D��~K�H#?|O�no�^tץ�3IQ�(i�0�\��cf�\O�����W����
<z|�mޱA�����g=�I���W����U<�WnE��G6���w>����.��{ �sTll󯄋I��~����i��%��(�v�*�XK;~�
9�zK���?����8��E��7���3҅��hv:B=q��Y:�T���B��n�G�m�9�M��OG�*�Ț7e���k[���NX8���	=Q��5��͘2W�43���^�)v��������30Y(��;�{U�56�]��eX,2dφ,��PMӼ,�T|�ƒ���]Nv&�t�j*$*;�[����;���<��XM�`1�N�>�bơ������׃����W7l��M��YD����E�N��m��Fwo���Q���c}�T{�a=;Vk:U����u w.'�\'�Nx=/�4�$�����$}/R$�qQ� էyQ�#]׀��
>�'�I&?��0R��-@ g<�#�P�A����X
 ڵ9�z���M���Ú�Kf��8̂������_֣G�+qiBc+�5:\�u7�޽Yh�7m��3�Us:��o�t������y���*9��M�7�惻�)Ξ�Dn5�(i�b�R����T����ˋ��	�&�����:Zt�S�{ � 38>n�U*��V��x|0�iD,&a����(�QT�>���+��M'� �@��Xfa9wa
#M�_Z�d��[�S<=7?D��A�W�,.�~**�n��8ʦ�
�a3�����4�X��m��M>�h�h��"�H�L����/��5�D�|:��ih�Ȯgi�X/�(���-3#��g_���7���z6�:�N�f|�H�֋�!Z�Y$�.��$�M��v n����(P��)�Ll�>5�&H	���`=�.~�_
�rv�F��R���X�u���j�uM��>��	��f�a�s��V���w�v��+�t�kW��T �z]&ˀ��|(�ɮ�A�����kvٝi)���'�����p��3ɣ�>`����mt*��}��]m߿X{\tiY�^�i\�:0��}R?DS#4�+ӛ �X� 0���E�� ,U��q�̹�EV�V�EI�r�2�G�V��̵��)E�7v4�B�#R�jD��ee�͡��k֬W� �
��TL\RG�����i�vBZ��J��5A>��W�+�ҥ��Y���-]]@�Q�dG��u�����3j��3Zb�OP��GV����]$wЫ�=ڈ�j"�˩�E�P�.�"�������W�1�#��Q�z��G㰜���~=�RneYd��m�oi�"�����u,'�%^��-(�+��`:
�6u�:	/��77Y,tE\�8KY�>���G� ��C�BD�3�YE3�(V�,F|-�0�����������5@Ȋ�w�aeKz�E9@E�^ΖZ3��O��b\q��[���b3$����*q����lc^��-�?����&��q���4����$���v/���<��q���=�썌��P�Ѯ�t� u`V�����H%iuU    #h��۳�E���:�������u7�N�G>c�|;��q=��bP�*,��E��$f/�؊m�a�!�~�e7g�h�Iv$|�k�j¸�����}���]��g�4��L`�sˆ�V�_	W�^��,�a\�"������T���$Á�<Xѳb����jG�g޸�1�3��k"<��7��-��۸���Q��V��1p���Z�D�;- 臵i���� 60�Ԯʈ�O��ۨN�N(�K�/ed��Z���֣*�$�=a�b<1��8N���p����T�e3z1����{����l=f�R*BUU��0#len�;q�X%6{�d��jFF��� `��׆߿������@WCW.7a��!��[T&E�!qX^1�<�|�W���_jy�i�[<DN����O��=I�#��er��&1�[��\NC�j�aF)Z�ee��q�z<���^X`��1��g�R�P�}�c�����,���G�4�)�D	�"�{,-�{��f��2��%�X�\%���%&I���$½ld��DS؋L�xN���U�L�ld%�(�����=z�����	��w2���n,sF�4��"jȡ����C_�S��S�@g| �sex��CD%0\��ﵫ>+��=w�ݟ�"���8�T����Ai�Fe�~d#��0�`A��$n�p�W��I��l6+�E����,��G
�� V���S��lh�x��E$}$YP��q!�	v	�{�>���r���/�D�JS�*U���2��	�3amƆl$?�&*�\
��!kn�U��k�$tU� �8ye�ѫ/�&��b��%:��Z)��֨N���Q��֣�(�E��{�}pa+�o���9�K1�S�x�w&l�D}��o��Ϊ~Ƹ�
��,v�$~�R6��#�xVJ�S������"���[EE�����O�/z�����o��I`PD��nfC���(��x��,Of��8�|	���?uHh7�ou}�Z��a����=T��G�H%��W����n�)WI�V($Y�;z(ٖyU-Ϸ�2��䷌��zL���&�SDUib�&q���4-E������5��b�((l����h�j�	�N�����Ӝ���n/�,Ns$E�õ�9Ew�M]MiHU�BD7����2
�|�~���Z4/Q�P@6D���[W3T��]p��5�F62�s<c n���PW�g3!�q���pV�k0$ e�cB��l/g��x��"a<ջ���_9C�˝��4J���O���ku%|	3b�׃2T'�'�Z����R@�&��5�X"��#*[z�ie�Û�施G��l��7����I��ޜ�Pԫ��t�D�����D��^L��+��j�-��,�5m�%�MO�>����C�F���ɾ'��x�=��_5y��Lkv?WT$��$i|��TS�}e{�^ �&��c8g�,�j����]�"e[STm���8+�V'�d.�t�w�d+v8@�@�6]ϛ~1pkSE7��$���h��`uK�����[j| �_�FS�����ywy�r���c� 
�ƌ(��X����y~󔻄�w��Ӕ�ݕgr���f~P1@ݳ��1�2��]?�*�����0�=T���E[��կ�Iτ'R|�']O5m�T�t�S @ׂr�Ш(�4aLVˊ�u�m�7��\�4���A̮U�,��R@�Q��S��LA��7��r=(�A��]����u�a+Zl���}�U@����Ӻj��3Qۓvy;Y��.!"*|�z�y
�m���>Տ�r�/����*��l�:�������>��{��FR⼨�(�૘ �w�Op�4&�eّ�8�ʞ���Ք~�B �Ĭz��G���Bz��t�	T�$�~G��O�i��v�=��zI����ڤ�۟�(L��`,i|wd�����	�рTt���eX������퉈���J��\d[ЦmYƷG,���G� )�Rh�8�.�W	=ɉ$�L�A�/��b���XL��uU�0#Vq�D>G��V]
��QO�=Yh���c�L7�?.�@'�=_��N�|�a�8]F����-���"�ZT��
�x\/�@S����\-�Ǧ��-��;I� ?A��!+�_:�����=-Gi���ga��4jj]xBJq|�هP�\���ˠ
�^�@-6�k�>�g<�Y�W-���#m���A�G�g��%���߶��g�@��N�-�,�rb[������.��,�wa'jVL
[��TD)'S��o�2
V4����vϰ�(\���"f�$x�H�Z�}��2��y��w=��Zf�'(�"�����B�н?32c���Z�����M�( ��B��W�2�`Xxa�����PN�j��bY�mv� ���cX�,�������9R	�=A�� ���V�_��%IZ�>h��|H���o�D��vqg�@�?����M=J~_�5I0�� i1kr�c����rЪ.uu���D�Ihk��Ĺ�vJuB`ë���}�[�<l>֞��]H~Ҵ�}�7��a�&�kA^Fd����vY�շ?y��t�.:+��}��̧i�)��?o!xRY2��<l~T�j�t����mO�󸣂����:�*q?�"�,���ʤ,�V!Ϊ��j����Ԥ\�_DR�j��5��� c�C+��T,ܕ0 �b(�
P�зTj�q���6g�!�b"�{a4�s��u'�]����)>�`I�J��Iu�E�a<^�Խ<�Bu^W;r�7�Q�5t�֍�	5P�db���z���O.���l>�7�A����ڞ1��m��hc�����U�*��m���˖)���'�̺lUL�O .�p-V��,&?�UEU�^�Ԥ��<�QfVV��v0mw={3o�2A0�������#�}������ծv'm���rZɣ�#a)�D�3���KX;Gw�	~?I> �����������iӴ����<���<>l�){��E��Yb�A�2!4}���TZ��JχA0�pZ�S��#�SݝR�#�ܝ?�'���i��"@L�>�(_�x�k�i��捈�j���B�uH+}�N�M��^� &��;}/N�ҡ���"ю�ٔ��p64{^�/��1�y܊3]�A�;y�C��*Ä6ʿ�)T�Ý����v�˹�ur�������y���y�e�RBT��)�)ōbQ�>x(<�l�9����rM�����P�-iǝ�$�����x����%��jS	� �M!su:��Irc��;]��%Ҝ*_4u��}U�����p����Z/{�n{2�^��:1�\qa"*~B��a�&rm%r�4ׄ�%�C�[���3��(�H|?���5SC�ԼcT���Y�6����O�n���I�	u}6���q�f��i����/�=j��
��geU<qUb�(��N7�]��QY>!e�w���x]���T$��a����J`Ù�-����*���6�]l�ӇmX�x6���jSy��eW7�iAL����?����˚Q���ߨ�7-61A��*��niu�I��
cƮ��0����-�ݩ�}ui��Jp��0��߼�y�VS]n���]?�3"VS�]�#O���y|&���Pv�#��Tȸr����~<}�-�$.�z��B3/�'�04�DYZ�Q��ƼI)>l~D�&A��#mȋz�E�/�x�N��M�\�/���&��0ĸ\׼���"W|�cw�-�E����驤���D��m{���Ail( 0�(p��{�|UN��V��q���bc�>������??Z�����%7�$���|AY��#ERgD��b�l���ȥ
M ���R���8��#��1담L3��,I=#·�@^"Q�_Kbz�r���Y���*cp잤�)�����U�E9�b�Y[r.��M+L�S�Q�W�Z�����"Iڿv���1�+�G�\C8"�[7��v�o�yf��"	��֬��s_s��;'��� �o��v�������7�(��ζ�ꚦ�&�e�G���#��5�PrM�S�aZ�^����h9����(@ϵ������6�K�ܕ�t�m���3�%�+�~���?�o    ��/�+篈I$D� �8 ��F+nhw�ǎC���I|T��@�X��O�;k�O~b���ǋ�q�o�Qγ�dε�²����%��d4m`Յ%��ks�� k-1ZsF�,���Q7kV����fvm���oQe~�_d�`p��m
΢,��ݫ��,V�/�xPlƁ��$[��=s)�w]]N��'eyo����9�i-7�N���`�օ>Q6;�VS\/Y�ϱXg��uJ�LH!UT��bQ���K��)to8��K��ꈻގP.�X���f��:B��?&��p��2�3��m���u�Mۊ�'��y-�Z4�@�����MuIw�� �؋�U�#���5�>B�،�<K����b9_��n^��Մ�6���#��0�U��f�\�e!�nE82sg,�)E��Q�1{���t^�c���O�)�Ug�G��Q [MVn�:�v�Ë�M���}+<�ߩO.��?����/�������$�|WZ��_��;����?��d<�U]�97�Uv����Bq[̯`��g_�i:᪦���K_&�G���cC�`T�+���B��J�V�b�0;���6/�#ī�� 3i�#�l�{u6羬�	0�4����4x���4٠ȿ��qM���BQmR~�A�w6L�z-��Z9#��bz���:\O�s�y��>�Y@�љ6B��Y0���?�vڤ���E��ؔ^���"0A�ȁoH�.���U��H�	u/����<��q��A�:rio��u]��+��p�m$�7ѿ����!*��{@�E�?{�����#������!j����u��8�EH[^[������d��];�i��M6.tQ�~_��Gpgv�� -d�o.��&�Ѝ���Ǡ3�6a�qࠅH�7�a��$�t͇�"�� }�x����P�a?�0:�x�q 4*�\ϻ*m�ʙ*I��\�]p�D[�܈ �?�:�����r�T%�߭��uCOz E�f�誉�B���G�D��ǅE59oW숫-;�]��`�P��}2�@,sw��ءI����s	���*̯������� �/Dh9��l�����Մ�Yŕ��Va�G�f�l�PM�l
o / (��p|r�?��f�8j�oy���'X,��y���C�UU������͉�$��@a�̌��t�`�����"L�=��x��G���=P{�0z�T���w�0�������YY����x+
a'�t�8����{:R��f7��nPv���h1��\#�&��r��*���;�UI���Y
b2��$M���70��!$����Y�d�2K����5a�d��*�{���wm7�E�RZ��g�H�`��.��>I)�*��QI�)܄IS�WҮ	N�����{L<O���w�v�J�U���n�|
O�Jk<�u:Koք�:����$�*�Vy�hQaspMNr���o�a1�S�g:�GO���I~��,P~�?��艳y�7a�T͔���o|��qȬj{R��}9q�LX��#���L��&�벙��4�;���4ޟ u\��;��E�P�ψ�rc噺�&,����,�r�*x��Q �xt�IOU�)Q������I&��ъ��%�u냵�mP��~W�����v4aٖU3!�En�����_�yQ�z�����Y�:��Ę���fE,�H�d�>!�!G
�u��8��A�x�~�pu���&��)\8wtS��%a�âQz�r^��V?o�r�����ϰ��YN�4-�yNa��툩��b�F�F��_K0�B��RRщ���e��Da]����T�I%a��a�����K(  ���e}�ўaz�/V����Dq�F��<�r�{&a��C�E���ȣ������}��oE��c��@�sA_&0�$������p�\�m���>ءM=W�����`	=
`�L����X9;�quDO�Q��3��y�����[����C�u�w�Zu���ԓ'ډmH	M�2���Y���6<��ě�H�)G�_��/T[XD!�dY{ 

T��&����c,u1g�NY��H�2�����j���vM�v�Sە����*ćo�{��aC5�#FP�ؚ�=����`���6�.���#ӷ�J��@�����:���nd�O(��}�l�k㵀Dj�'��g�=�YW�k���kXS���M|���+��-%�[j<0p���w�� ɋ����QS[V���<�\8�&����}`��� ��6\�輐*V5~�k�G���e<��=�O�+af�x���v�y��v��1.����*��G����O�p6X�;������}w&qH����\�
e�E y}��Xj�� �]�P��25Ͽ!�U�@����Eٕ��@5r�I�-���%{v��f�8y���u������v4/�(����O���L?}�2��)bAB�*e��=j���X�6�P5Y�LH��k�Z�\3��;���VWw�@�~XQj�4P~f$�\�_kE��n��VF�<OZ[gń��J3UI�8��=[���4�ZwxU���=!�)(����F��$Jz�K,���K����0�`R�IT��"J�/̄�h�xx����u��J�p�3�HO�º�|"H�/���{�o���}�Ū����b�MX6�/,�i�FSҕ��]�a�P��'U�g����_$��d%:+x<7��#�x.��9��\�ڥ�]���è��̂��qS`{����J����x�h���F���]�̒�3��>��c~}?���St�)� 4���������9���Џ]jhE"��"ԙ��[�H�Dl�����&9�3<˄>���柪c����k��� ���/��nk�¤H+`se��5x�Ppr���z��M%�cH�Ft��>V����N�ú����L'u�V����p������yF�E��0�b@m�2�Lڧ�g�
TS9�G�1�\�tAe���7�n�4'�,���jG�C���@�q6U��4l��X�C2
=(�+��&�`1˃��AM��]6!��I��2x#cP5E�5$����b���=��&�"'G�w��v�-*�s�{.�ڊbFh����Ҍ�&�0�)�4J���/j��"u9a���Ɇ��R�m�����p9=��s�W����q�]��jw_eλ�Xtgò@�k���0��~����8�\��E��%>�� 7�F���6j3q���o�	�e���3O�(��4?�Q>�Q�b�M�7N��zaF�2�bF�d?R`�	ݑ���O�ؑ���t�/�&�2N���8�Ŧ����Z���+����ӧ�b2��Xu�n;��^l�I⶟@,��2�$N\2q?&�kmUf�콭�����$�����L�̏��t,R�E�R��h؂l�a�7
I�(�� �zƱ�E�|�5���G��h.'Z8ۆ$��x��V�/��,�o���
���CO�B��J>{s�}P�F�"��4>�Y��%��$yVOx-���_������#��ᅖ:�b��\:MR�]x{Q�q�CP�7���� ~��1 jLv��?�N��W�����wTpߜ����*�[��d�q@�ch��ĺ�R5m�������[me@�D���D0Y���Q�c)�₭G�@���^��g���
AW�+z������K��E�V�o�]�s}��&�J�*����'�B&PP�o/�+?��7�5������!{[�����%���a�[&��]ppq`���'UM�y*�d��e�^�z�b����Rf�����k��{^���fR�,�8��e\�.gA1���)h���S�-o�oWB�fr/L����8 v����s�]��>�/+W�ڊ$q���_D'JF�vO �����A�"b�Q������XL�r.��&iCW���*=>(�(r$k񚚁�����t��R[h�.�'����H���$q�I:�o���P�BӁZ��@mEs���/<�2���G�󤛱-����*re�%I���n|���^`Y��£Je)�]��w�p�t�JR��>C�    G�2W�x�fs&>��.�^�㺝'�i�DD��8��I|�)L�9��q�IO��sCQC������S]���e�EE7�怭��3��n��e����(.�|Bxݍ�_|�-�eASPऔ�lG�fj�y�w�W?��>�t;X7	\N<~6�T7M?�&E���� v`�_۵.�^���®��Pub���
��.��W�w�Ӭ(o/[����~���0裷g�d���U`u����(�+��&���'{�qE`g֬���g��Y���QVD&��$e�c�Epx��5��o��5�J��ǒ�v�[ܽI`������s	'U�#%�W���1���M�Å�f�O�����_�Һ�Z"[6s�:`�PCD����ٚ������b�]t�n��@��z
��?�����B4�WPu������n�bxj��5߿j���l�ɴ��t�Y,���e�4
b�Z!�Š(�N�5�b���Һ�	IY����`���ő`wՔO�Y��Ԕ��'�v�>#��t����6�:��	7�Jr�>L�$�i����spd#8@�C\������D�_u��*��0�φ�촡���N����ng��o�Q�թ|�H�1�J�]��ӥ�j2�T^���/ ��Ur3��)���&�6��g^ք��FU?n�vZ�"{�:�5�ф��Ua�U������i+�if[�f�*T���~���@ �|�"y�G�B:�9�לf�O��$n��Cg#�=-�_)+�!qd�m�B�;��-�V_��
�4��8�,���^�4�{�&���+o�X�Ǖ��e�;�Z���T�;��a|#���J���{�|�2FY�� 'ʈ��&�q-�dɒ�Ϻ���Q�/ye+I�~��~h.'�#m7�%+If#�g�˂���H=J1���,�O�czUT��7�P$���"�)|��D -�/t��7�j�X�lP�cg�V*Q��&�l8�O�[c�9�-^�W�_��f���.X�
ՄM�m�*�Q3|�;U���@pmڂ⦨%���X���͕�?H�a��k���jKh�0�y��V���{CtE�mT����գ��*�y\t����2P�*ҊZݿ2C��:��ɋ�%�(�l�� ���w!�/[B�{Z@+�G �כ' ��^<�&p~1t�l�_V4ᔋ]dQ�/6 u�v�<�P}�O�[w�������w	2�)m9�ـ�Y���[�id�7K���IY|"~��B�fJu� ��MT���[5��7g�Z��
m�B�P�L���g�EeuSg"[e�9�$Y<6���Ň����Nǧ�XU��������ދ��� ���ѕ��s{�f^L?>Z�E;�f8k�������+�U��ܳ����/���ii��	�KM�#�r#Y���
�.����`�ɝ'Y<B�St�^�=5J#��0|Hp�Ÿ�XMv��M֯�����E�C�����C^�,iX��ɳ�F�����=�v[��XF��l�c���-�\�aA+���Lq�����I$�0G@܄�׋ƹ�Ⱥ�g~9m�\	�QM��n$g���՞r�-�z�r��Ԧ��iI,�
;QQ'�����\3�{���6�W���$y�&:ẅ́�A�H�?b$!��t%�l�G��y�EA��� .R����V���.����G8jlZ<P�'��G� g�@Al�)��4>��e���)�IT&��2��W2z��Db�4;�H�ވ���~eM��d�,[)�T�2.�q��R�Z޽mU���:��?\S�(����M.?�2��I�n�F�f��<�Z�m+��;�YR�o�E�%�<�<
~�Y�D�(xRD��9z���QU$hH_J�ʹ|�����y���+�4����	 ��G?/��2�&_/������9q�[�Hyƀݺ�p9˨��iK�����^}c�(�!u��|9���nj�A��;+�[U\�#�tV#�0pz*Q(M�����¼J���tR��'��i�+�:�����~m�uK��Z2"L�b�v��A^��;��U�g���S��� ��d�\I�
p2�G1m�P���������$��ۈ�$�d�<��cG���x��U��
|�@�.��x�3�7��F�pa�4(�^�Rv�6n>�|��c���F�d�E�\�N�Y]�O����ۚo5A.4黚��[������l�^[�y=!xE�g�y���ֽd-A�愕$��N��k�����6~�V���cW��S�^�g���V�?\ͻ��0����x>]���NOƞ���Z�_�f'+�ʺ��׃��yt(��My��$�t?Ԕ� ����E%�~�.&�[Wp�e^�l�r��r�����b�0Ֆ��#�Q;����O>E�J�8�*�@�T/�d�]F L�I����A�Q'%$�U�?�������2N�����eE�s�y�g���Ci�%�L��{���i�>!I�3x~�+sQ
9)��(�⟉6^�������h{#���$E����J/��Y\R��'���6������x ���N���(����µ/��q��z�_,}����2Q��#��)�EI�����o�c��-2�,x���/�,.���ɼ䙩T/��L�#�t<{I\��#�ê����`�ӌ�����B�����m'�����]�W1��U鯠܁p#]��CÈ�x21�<q$J��0l
��RAJGD��غ�ˋEC������V�6�zσA�9\{V�i�H�꠨��,�Q(��/��*�_I�I�@�;V�\cx:�`.�bv|�eܺ�]��zH�4�<����Z�h-��|q�WP�<�"�NOټ%��Q�=�<h;4w�blz�����M��޿�k�Q}�09��q�V��#����<��	��O2�s!�֝��5]}�<��F���k�,�Ίs�vA)��������ۇ{I^��
�@�����y{�#��K�!@r;�%W���b��TO�E������$^�+M�(�l�\�d�s���eO&��qۦS(�0ȴ���#�E���|Q��������Ey��afg����퍉���ߋ��,�Ń`L�_���"C/M�>�b�o���e\W�RI�U�m�8��ծ��F�ԑ���\[�M���`��
�)�G�#`������N���9v���ft*���hĈ�؝�X��D��o�� ]����l/�$4&5x�A�^�_�zD5�mO^����?��y7��>m��Bjh�:o��ʫ܃Ii�Ъ�l4�$�tw�q��(K�z��D�Q���G��pA��r>��2)�~�yͣ<3�G����ģ$��m��`��7�:�kߝ�Ō-	��n�s��~����\�u�OH�@K[�W����������jT8��M�iC��kn��W�V?ơ&3��]@)1n!Zn��l������f��@�+�A~��%��-T�-����<���~U8��nK`�D:hȔ�ڞ�E���+a�}�)8�n���v��8��r�#i,��Wq�lv��@��{�^N��jf��p��?tזVE@���n�pV��IR���}��./�s�'���{`�&k'd�"OB�ٳ���ϳ� ��@�ku�:v��q5����~�j:����S�/����;q��eޖ̈́.�����[��=]�R����MSc�8��ߏT'��iS.���OH?ͳw�u����v��Wqy�r9����)�2J�	᭢�ۭ�Ep�P�ΔM4�GD1����e6̈́S�^��,�a@|���;/{����H]ް��74u���]�W����s<�VA�g��N��,��V&�1�:O&Ж�0/<���t^��0;�u)w$��D���e����W�N@H���پ�^�)f��
�.�cwϩQ���n��vʽ��"/"Z��\������������"\�"b���=;0)����>��#:T��OR0����_}��w��o�4��u���x�s����r���;q塕lW{]]	��k�`ҡGa�r�X׵    �Ű���\�:��\g�d���*���T�Wp{����!*e��@�#<}2.��#��w��� �O�0��*
~�6�@��:�X��hr�n�V������m��	���k\��ۭ��(��W��G��~�@����m��V-'�?_�Q1�%.�R�I�qhzz�n��.�r����
���_��
]�r�d M�2��X��ؔ�ޏE�����޿>l�.%"��Oz���Ko,�YRz�A�o�^s8ҡ@*,[��zwE���%A�鶌R���b�V�#޾J�p4`�\������Tc]�L�n�W��K�	������X�a�N�dE�,�*�Ǎ(�,�"��~ B�-��?��ʛ��p��2�&GU��<�z=;t�0�`x�{�^ŉph��+?MQm���x\2"�ظg�E�kg�	ع�rO��{U@/�5�P��X|�����ž�W���(D,�� ���l���Wq;���Ii'0u�S����W�w�&�D�i�Qp͋�C_�#��EO*U`�ba�jC�1��j���d�vU�=��w�(�}�7�@�Ύ��z,�U��S�f0[)\���������#b��[�?��j}�+
�M�eS��L����Ǯ�PZ`�~�-�wW/��!�ڵ���U�)(�^��I;'l�w��>]M�9W8sE����a��&HI�l�-3�O&߻�T7VJ2��9v�4��Ad�{8[�L�)w$�'���?Z'� _C�OfA$����}��Iz����Ę( y���;,p_SM�M�Z7y|{u�:�Ⱥ�4���q�xg�0R��$m��KV~; u�z�N���U�p5�=Ɇ�dD8�����	��,�Ƈ7��zk�z>��
=��^êP=��2��=V\V�X�wk2O��,��$����i�|R�i���vE�v�*?��a>��t���|�f[�T}���O����Y�H�7���\��J��!VF��u$��ң{�u�,��h��~�άp)�x���lsgH7 ѡ����N��o����v�� ��r|����@���U/e�+	�N՞�3��;�p��;|3�Z����p9�>[#�C��_�?�6&�A���JW��7�j�)���*�-����m��y�n	��q�mX-d5����u�S�k�L*"�@w�~	A�~s�;���eGY|���'~��^5a�eY�ׯ>���?O�D0"*��n;2��xG�t1 m�t���6TG]8Ò�a�����g�e��e����u�\}�k#4��c�]N�w��
��ҽ�'y��^�	o�\E���o\y���u�U�Y��&ҕFa�&��wu��1�����QH'�ԃ;=�U�o�R�M>� �K�X1E�v���h�<�Qk�o�~&��S9aE���/���C[g�
rV��u?H��ɗ��i41V�aK,�J\]C'L��(�sq�I��ǢYg��N�$�)\g���V��q�'#PWCA7��Ǖ�X`]��F��)a�c�=��c�իa�����p�e���	n2���p����_WO�w=P���D���$6��:��.� ߩ�}&rr��~;�����Zv��1�0J�+������0#3����@��D�T��A"���(=o�_������6Y�8ǋ�滮eR����y�����i�v���'H�O�KAW�uݎ��_Y�b��u�;��)V̅���.� \�Gil��4�L�l����������7��Z����%vo��U�����yk?��^(������z������<Ϊ�W#y�V��Q/� �����A�Epv���������i1l�뛚Yf�u[터%E^�����APu+�.������y%,�微A�v�^2_K�G�	t�<-�,�ؔ�{>�*s����M���x��W
v��-W�R��G�j�^썛R���h�|o��q�A��1�$6�����/��	�2�e�����{���W��j�Gx�E9]�pf�*�w�}d�N�Y��u���Wʋ(5�Q�L�7^�����CP�Qvi�s�)�g�`k� k`���a���Q����d�h6Gl��M��X�Y�M(d�85D�Ā���PAM����5.�m8����ZI�Ɇ�/�-��ꪺ��ͫ0�|���Q�ˉ�c������)f`�E�8�=�@��2�P���mx�U�?�s�vN��U�7;	~Sx�K-V���ʎ�*${g��]��'�^���L%)Do1�$J�z�Zf]�����+�<NW��o�3�u��
�. �c-�9_�$����#]V��k~�庑�V��*+��K�"ʼ�Pg�����(��a�E ð�i���O��Bl ٻ��ޒ��圪�K�u�O9jqE6���GG��8���͐�s�<�W�/��@���ie,��{��M��1������v��m��-�(�=\\�C=�my��'�X�t��6lZa,a�[���L����/��MN�I��6�&��������>��Ñ�%+�}���Ep٥@�h歛ح@�����[��$�gCH��4-'\�HkW�*�a��K	ʠx���&�C]ꛙ��j��r�y��T�����(���s_��/o⺒+��V����d��������������NW� ���JKD��_L*̦w���27�'u�Q���N�p�D؍��r'�p���F�W$��*��Vp��E�8r���?�6c�(�y��[�z���&��b"���<_��X�����*d�"!��e�(��p1XԴ�Δ���6Q�꙼�|��D�;�Vyٜ;��|8S`~u�_�� �(�h##�ۦ<�ĒA�۪R^�/��m���U9a�ZiYج:���5�nY��",P��O���T(�}���|4IQTj�2�=F1a˦���\{�QDk-�p�V-�*�+G��_��I�h�� vU�U<�)tu���Y��,��1_������*�К�$��T�������!�e�y��X��k��-߬vx��%d]6��a˵E��A��E<˄�qo���2,��%I�N�D�ZE�S��n�h��a�� �J#[|��Zը�yZզ����G��F�@R�@�O_i�e�=�z�4����R� c=2�v*����;OPǈ��`{�����f�N���7���E���>�Q A�XKaR�T���M�l؏�wo\�Bٮ��]�����t���H[E��4�{WPt{{�3d����[e�
[]��I!c1�J��$��)���FG�%Tg	���Wśj{�^�GB�����OT#z"&Q�Z�~Ra^�����6U_M $B�<��dI��T�F���$�K�~��ᾨo�����U>q�8��[��(l�v>~�h�44���meN�!pB��F��ʅt9[�ٺ��e��V�F�,�R�H���d��I��Ή���%ǐ��~Sr�*��:/&�;�$)�V�
T����f���V�/����"1�Sv�R���R2m�]���Q�,�N�:�j7�H�Sɲ$ɪ�21{vw6ju?#�ɀХ\��B���4*��Q��׽+�����]פ�W��eDo���^����p���{bo��s��+E:�� 	�z橃��A�J�����p��#M���=�>yb�*Af�a�W26��j�|���M]��&uYΓ;�����(]��e�#J�}��XgwZT?�~�p�yu^u�<������r���ug]�Էwge���5�i����R���ʪQ�Ye��CH��l�0� ��i@�l�d1>�lK������3O��J�4~"5YD
@��,��߼Z�_���@
D��cu�֑�Q�NPt(�̛Ԥip���ʰzaV���(,\Coq]l�8��M���������i:Nй[ �bf_���q �R'����k�uDq�㬓�3 N�(�^$�\���Ɩk]mW�N�,�$�ĝ�@[�c� �l] �pݑ��8���7������ȥ����U<��A/39sՔY����^�dl�l+�f��)�W �
����T@~|4r��fǲ�x����    �����9�?��G��5Kl�]l*`~w����~�"�(�(�O2�¾���6ܷ��&/@�0]6
f�	���������-=�Dl�N��}���_���aO�C���D/:��2��y�>�oVq�R���<��2�),�3�	W_��9%�)m��61��-7��ʰ�eLخ�<��E��*���~P[[0���"��a���0�a�A*Г+}�uz��,����j�	aK���A}Zo��F�Μ
��Lǽ2�t�S�7�iT��!!��*����0��IB�Q ��D�-CM�&~Ӷ]3��Uei\E�*��u��1���KoCN&0-<$�WV�p�����v}R�^^WyX�Ve  m*Nb;w��~�F���������b[lAi���]�a(�J�3`���Bٱ���y:B�[�zOM���֤�i6�*��n�T��@��S��R�F�$o�DD��o)�'�=�z��p��z��c��({o;��6��m�N�mN��?H8�:�Ҥ1.�vҦ珓�\�<j���j��W�Qnۧ,
~!`j��~K�.�`w�Qou}Vr��]W+�a��a#�c5ale��î��K�	Q,��+�dq�����f���7��0�Ǎ�֐��3��0ᡄ��J����"��&�5
>�%�
�`('�~�`�&J��:��	�ݧv�я�W�+������6[�3�'Qt��GK��=!P?b���W�4G��+K�5}2Eӯ�: ��+��������t� 
�\��qu%���*Ld��L�w���(�e��EM��f5nM�$x'L^�	���Jd��>��}��l1���d���[���V���4�p�tB^�B��Ґ��	=�{�7_7䤢a+?����"l�r��8�]�儗�un�M��,x$R���|<�ޘ����(>�oy��J�r^��K� �B���|�j L-��P���y�]���Ϫ�*R�dy�3=�b�`7#~�Pj��KGX��2�[����5K誤�W�a\ƅ/����m�YR�hm�e�k��5H�����G���`FmH��b(��u�h��N�2�=lIZ�>/��� [+W[yЖE��֭����q�!K�+ʪ���P_tm=+3V�Hu\��������մ�����ˎ�NtGB�詸Wp7{C���j��j>��ͻ�v K�eyn���l��|��S��7��7�=ڨ;sv��]0�P��,ư�����G:���G,(W�EǌO+�6=� ��XI���eu�f҈�[����7mĺq�oD5Z,��]Ӿr?��Q-��d�'MOv��8�=<c��}4��ۨ�R�[q�KE�	Yc����͛�KSm �1�͆�][_M��.Azjd�?�5�V�|�E�zFh����d�w��*����'�����'�,pE	w(:!�b���u؀n779�T�{��u��%���`��g���'q1%�TI��yp'�
U*}2� gT+�#j�)J��m��z��I�v
�ͳ�
����4M��vif^{?/�����;D�DE?��R)��V��ⴌjŃ�Ծ�vn��bj@Q��h��Y�j��ȕqb5o^�c��*$�x�Zf���,�DI����<�'<�Q��^>*��ߘ81�1�>=����rѺ�0#D��"����N�'�V&�:�E�3Θ.�&���N�أX�(��q���$�umP���c)��`�l��Y������\�������X�_�UߜyBzd�"�k3W��f���GsxI���W˽5Q����_��^p���������t��gQ"��97ϴ�0{q�唟��:1$�W�Bn}iA���f�^�K���O���X�Y�?"��Vq���~ �����}Օz�()Js?M�Qć��8�Q �|qA\�W�oM߻_SOx��,��oE���H{U,6i�"}��X}	��Ǐ�����_�#��0;B��tB�u[��4M�.&<gٕ�B��0{���TQ�w;#(��^`�+:��+,�����[���	a�B/�Wd�·�D2[��N�v�y.}/��q�xI:Mi���;�.�B��+�h\S��0A��t�h��Ҷ������[��6����(�	�ڤ����L�3�
܏��zA��ĬP�O�q4��mE�0�h�GltE���I��AR�i7�b��0lz�8�~vn�������õ�:6P�V9�(�]�j��خ��>�솁Wmr��͟8��u`��;�]ڗ�F�g^��ȃ�͉*<�T%��2��A�)�E�o"��ze>/����lB�(����>P��]����?��  ��Q�8oأRR[y�d�*�A[�Ú���8�n�8-Sw��E����A5$�
�Ьl\s���i'�Z����y�'iߗ�ݫ�t���$��cE�2:��~��w�.�)Q�Kr��r�[�4�y�Q���3��~�Q����II6R��)v?���a<���4"E�XΗb.)��������,ΰ	�hA�so� �{�ߺ���ac�R.f?�IS��M���A�gqeÞ2�T_L�Ry��P�U�%��	%u-5����=����]�:�f!]�Wu�Z�AD��y8w[cE��/d�����Ԫgu��}�#������}�֣�f��w����e�|u���)W�<�w*�5�c�^�l����t��l[a/Wӣ^7l����"r��dx��2��>x���w6;�p ^�.���m
�`c�E�s-6ޝk�چ]�f.s1���$0�6�`�5�T�Zv���J��;eT!1��PHp9��\��6
Ӹ��p��,�K�2~;Z�OY 	��/D� ?n����lm�j�zBiVE���Au��*`c�= �w��kN�p�u�����^����N���(/T2�����5�n�޽�Z�YXLH1�;!>�y��Qj�gKc,O��}1R[��eE)�!8�@�R.���l�r�����^����,mn�m��`Y:�p�u6A��p�ǎ4Y|��gĶQ�D.qV�>X�g*���AG�����:+D��{fe�nu���1$I�x�hYoīy����Q��֍���^��U�,�^��u�'�n�$i��^����a�u.���)��Z���'�K=�Fw�Xu�$�6Zm8�deEZ=QE�#%x��ߋ��Nft����T�:H����oW^J�4��A���T봦;B����L6����K�����Hs�(ކ�Ewo��Fm�TBWD�'TI�ߞV�]���Q��ܡ_6'��m� ��� �v��$��*�M�<�}���:�����LĖ6�z�OjzL`�?����!��K\H"��g̦&ߺ�4�R@�I��g.���6gT�d�~�I�a�f��2W����w=��4�_�֋b?���� ��ym;�(���K������~I{��*u�E�߉2��Z�Py�������MV���4%�T�PǱ{b��ד��l���c*�Oz�˩6����=����<�*e��k&�͒�
mP�Ge��t�G�ܵ�����I�6S�TEކ�*S�{!�T�0,�T���2Dd3��o�~M:��fU����/��r�.�;6C��I�r�@���>V-K��0��]�V�>&Ks�����"��=8Uu&�9��Ww��Q�F+UFL�.^�T�Zم6�� K�I�3�j ��R�٤.ڸ����r$u7*�¤�*������Mq�@X1p�eK�V'j��&����}������߱K�털��WP��8��\]Rgi��zE�� V�Dl	�Qu�	9�C�j�_�;Sᢡ��kи�w��G�I�',�]����0A�v��d�[�Q�k5���	�at���_b��p.�`����4$��+	�L��w����/ur}�`\��͟bF�0"g��oD6��e�j�CA:N	�<���9�m�4��)y殑����k�ԂD����ufMG�
�l�2W�] �H�\�@��#��6���h6A�:Σ��������|�Z�؃�*��,�@/&,��<�5��u4!(I�>������jY����"	����    7D>�h.�>�%B�&E�N ei��>����t�Ff|�O*8f��Qĳ�[��zxJ���uT�8ӕa���NeԣZ�8u!��Y��F�j�*�'�9�,2Y�,
�7lI�y 1��3'�[�F0���	�������َ�](
㣹��1������:IW�YV��̢( ��(�^��<�4]Ҥ�_n�5W��4a^���gEX�v�8xW��k��a�:E\�཮�f���'��V��~H��� ����	]L
jF��6��)-����$xt��'U���˙#x*� ��3��31H	Y}�D/��s������|�sW�W�]|��Z�P�L�Ta�_ӧ�Y��r�3�w�SC�By�i9z��(&�1vg❶IG����r��dQ���A�~t5�9ᛒ�w �FUp�����݅�9)���YlM=�![�����Q��t*ʃ��%Pp-Z#�o�.�T��@���FI�?A�%^�	�~���'t��(�cB�vDx�!�\moGq���GQXF��{�S�!1��u��B<u�lWڣ�G���崮1���;�}w���L�]�Z�;� �}!�dڇ�ZH����\�ůb�?�fxR��* �	U����/������꿆�w����[��B�=�.�1z>�:��G�k"���8��g��/w�)�J����F��2�W&,��b�-�M�Ҥ�����6�OʀHh|Byޞ�T=���'e_���ջe���ګ�߻o�����y8)� �%���J�]l�1f.M��n&D7�
�*0��;�[�=��?�髱$��B�
!Zn�1U"͊,�}"�
��xoY�9I�Q��q�]�u\�Ǯ� t�;��Rpݦy���W
a��tbBr(�:���=����$�?�o�q ��]�/�T�`n� |R��Zx��_���� ��D��Rh����^��hP�9��,�>�|�l�c"5:�� ����đ�I��rp�b�IA�M󢝰I˓�k|e1X�We頪�c�0:�C��N�����~ؠ��ſ�x���o`�)uN1y�������`!�Rvn��%y��+�zS����.P�S��="����j����_�BU�3-�)��G��!��V��F���1��Q]����"b]��@�r�^��q�3b/T�p��W&mM(��ҋYfq�ԡۈƆ:
k���o>q9vm�CѤ+#�������;�w/eЦe��A�e�m~�R�1��N�+��%�@�I_���d�o_Ł�f�����lt��o�ج`.I�6��:���q��h�j�m�續�O.���G�ľ��D��1�h-FǙ�����N^Ğ��Y��h��V������S�T?�lF8��ߞ�؋�m�js��(�lƯb� N���?.�W�'���:����0!�ӧL,g@VO#;P�)?/z�O�Vw����+��gS�͑;h0��+���Y���3yu{q�ъ�� xm�P?7�s!ݧ���gԦ�I�a�
t���O������zћ��8�lР���ф�\�&�j��qP'Ya�3kq���!�ä�pܑ^Y;_����zJx��o�c�q��VMs|p����u�U��UMR������!�zJα^o�6@��nh�޵{�#�*�* K@�e��7��vX�f���>�p�b�����j�6l��k�Î�X:*��|e�H��I|V��LRdg)�Ij��n"@l.�RKfn�x�r1���SYQ�턈�Z�l�$��Hݶlr9��k�d�-�`�կ󁖨4�v2��,4��jNjM����<�g*g�<Io/u\nL��IdFGW�<q��9g��$����SV-��{]�Bѧz{��(�;?"��ZS�t�>L�ȴ��gث����]�f�W_ �Ɓ}Jn����x9��H��N���a��J��� uU�H�\Wq7�u�� �]+�5��:��c�ڴ���U�@�V��<E��
�Y���X_w�+�����(�Tv�t���b�8=�|��_��633ܡ�^��h�Y�����\�.y�y���f��TW$UJ�#��	A�>�zJ�����Q��!b�Ut�qc��f��d]\M �UZ�Dc�$��Jb�JoƫgjB]��L�b+�˞��d�)�߽�g��m>A��A.��Q�qs�r,����?�~ޜy"O�6M+�bҋ î����l��<J���j���ИZY��,Lϗ��mu'sZ�CWK<�}1î��ɔ�`�=.HŰ��Ȁ+A����;6�y����Pg��|'y�W��_�D@xt�X}�F�Wf޲|��scYXuX��8OF'�C����,R'�<�t�w���iK���L��.���I�Ȟ���X�pp�Vm��;h&�}%����̯�'�$���� �!O��R�H�-�5�#�ͤ�	K��t?��ys�Vk ��s� �0��d�u,��8����,��[�K��x�#�&��i����cٟd�ag#H�i�Nn� �I��E����|�=��6�j�����9���9�̋�)9w�b���!��'�ڠ ���/ដM��+�p�$~�"����?B:S]�GA/���¿T��[��EQƷ�n������2q`�X?��� co"�.'�O��#��uP>�Ś���[]5z�U���@\D5��E�"�I�T�S�Auc�"v��<�x�E4G�Y�n��$��	Y��aj�"�Sz&�[i�L���ݠK�i/�-�9&f��D�b5}'AZ�KF%��E4!߲�F�����&s�I�;���>̫��o/�˼H�������Pv�z����1�W�s�&�M�	�)��c��"��e��f��`�Ǌ��8.v^fCK�MV����/���x}�� (w���QT&�T��B��s���]��}hXVe�Z�&�3o?�8H̓��9�<V���{s�׀-��2��$�u|�u��bd&�i ���,�=��Ġ��s�n��W�ʓU<JW�0�z�>�i���f�n`O[��X[����B���|��t�\��^��{{��~�_���劔�ŧ˫�&�ɑQ$Q"a�#��̿A��=��-&�QU� 6o�Z�*�R���NЍ�>w���À��[�s��𿄿	�O��\�B}Pa`:���r"9����*&�g�(+>�fH�Gq:��Ѻf4қ�������� N��$��*PLi��z��j�"j�	�{U��&T���p;q%|�`��ỏu�z@kn�7��7�o�<�dsډȐ �v�R�$KKF�g�i�������i��n\���H���N�象� �,i�O��;�X�u'�;�/���m�W���[��Z�����~yEaOuu7;EU�W@���e-�tn�m��G{[��Y�"X��/��W���?�:9��r�b3���s�t���{�t�/�`���U�(g���u:C�H\{v��re���E`�|&]d=v��&���sh�gJ�m�����/�"������*M��?�e�ba�O!:zz�͖����S�N���0BW,5�����ȣu3�eQ^�7�2q���!�'�Xz�`��7�E����rh.z~fg��l���4Z88|�_�6�7����W��o�`��E�����1�����j������iAt]}�xvY|�H�L���2d��|�Ey���������^���(S#Q��TH���3�୆?�Uy��Y��Xqf��g�������	���ii��,~Ίo��̄��yO��e�ל>���:�����uӄ3��O�\���I�	�ͪ�bO�ɢ�'�(��xq��1ӄ$����4��%�v�+���o$W�w ��#HD7 �����g�m�MP���r��Y���,���Cwy�Zrm˷���,U��i��Ե�e��~��ˢ�w�o�.�[ks���"�w>	�y�Oe\��tV��GC#�)z�0Y��&�U4�=�}^����b靖ei�7��kOhfk4��`{i�8;��U�64��逺�Z��_�{Iֻj���kŋ�w�.�Qv��y�Y#JR�\�f-    ���U=�g�������lk�.R&U�'���`�W0ɑ>te�z�OY/較Ӈ�aɘ�����B��5W�%.�������Z�ۼe�k�W���p��Dz˰N������a̲�(W>�;ɟ��u�bD
���gG�Q�d����a�m��Fm�	�q��n=��R�N_��A�s0YC���W7)�~]O8CI��A��J0b|��3�zג��qu�m�`��V�9�h6�h�"�[vmͰ�R|@L����i�\4���ɸ�J`�NZ�j�g:�*W�:3O���E֦'�.�����K��$RgE�?|U�i��0���/�঺zܜ����i�ט?�8W�SB�N8�� �;�4�,��Y�YM8wYQTV��a�AG*�T�b�ֱ<!,j� :�rr�s�O�"-�	em�����G�;R�BER�2g��Ex�c1��aL����C���W�ϔ��d<B��A�L�w��t݆������گ<>�斃bFA�c�d���:���p��?Y��s���p(���(f2����Og�J�U��@��w`�%ɓ�o>�͑K
��t��  &�1�糎)�:��ʕy����4�p�2ұ��pq���<�Qo�h^�M~y$R@=Ys"2��a-���bR��s�����pVI�n|T�n�dGq6��jv�Sog9���:��u�?lQ&^{-σ�'.��L�^}f^"�P��k0���Bؽd�*�WE����N<]�&�$���b���X�e�Fy9!����ɋ��L4 l/>��c�p�!f� �9
�xm%�KT9��v�)��+,b��v>:G٭���n7����a�L�讣�&R�<�ި���9��Y�"l����˾m����(S�&ʫ@��'�֎��xc\��HsS���W��	��l��UVQ7!fE�Z	]��{�����-�0�ؓ�׮*>�8����Rs�,L&D)q}��ۋȵ��Ph}B���)�-ں{��4����!f#�W./f�oQ�R��M���E���9l��E���c�X�G�T�I����0��=����!���k`�˵n��*�g%"���6�| �E�`��
�W�vs4Y� ��8%�t̋j�l�^,f��DiZϲ��2W�N�	Y����4��W9hc�:2�@; �A�d�-,�զG���w�rw�&<syZzh@��v:���r�\bD~�¿��.8\?BD��H4_�
(��E����W�~5W"> jQBB���Ɍ���x�9,F�O���M59'���X�W2~; ���#p���������m5P�v�b`��Fs9ŝ�hzU�$}<!�eY�Q�/�l�:#%W4�w �Ma��3�7Ye�����Y�`����*����t�����.��@Oh7�&^-�4�����{� �Q����L+�^���S,�H�{�a�M�TI���������i���� �Q.�(f�!��2�oO�9-b�b�a�N���U�%oթ�B��j,<k�h1y^8������5VuQ�~���*ŖQ��7�C�Z�ˤ�z���ˠ�u u.o�ypLV<��v�n�Ly訒��ex�FmU�����8���YodӪ�^��*:*��]i���(Dk1ӓ����(&<`q���m�J��)�W�~q%��YQ��[}r'Pl�v�W��Ɵ��1���2���b�|lZ׫T���8-�(��=�����)���R4
L����}��|'g���i���k��L��E�E��8wu:���'J,^������X-�`?��j>v0X�f'Q���-�.w��}�y^L��y�z��2�vr��΋ɸ�"e�n
��Z�#ؾүt��3.)(Jl����7;S*L����4�������}�Q}qO�Q�Sޢ$�&�R"������ݯZ� ���?�N5��v�H��..3e�+1��..�S�
��~��;�èk'P�� :iDiS@?��к�����a�\���}n���dm1l�����֒ Ñ��غ[�������0/'�2��P]��Մ�^#ت��/�)>oD���>�YY�MX�G��x�y�U��r����	�] o
�)��52W���������j���ۗ�q���ݲ
~Cg�I��![ɤ2��.�JϠ���W���P�f)'��$B!�L�6 �r>)�M\�{:nH'a���`�0����g��6GY�;��[���(�1�1x.�嚓���uS�u>!`�H��� 	��cw�k/�C�R�����E��٫@? ����ΥJ�N�)�$�R?����ͣ��Q�QV>g��~F4H�~�`��ӏP_�V��ό����ƨJ�y.����I^��9P%��_��nL#eR�?�)EҫL�(�2�ѽ<�=��c��u@vtK`�r���Z��6֑"�tKty0d�!��!�t��N׶9"�@B�޿Ϟ��:������r�-� t�wS�6 艂�U���n�����O]�=��gTU^���:ť���)��)7t� M5�L�P���߿��:��	�H�� �Wr�|�o��A��5��<��! �u�3]�*�z��:B��2L, QV�\��zRh�Y�tԱ��JC��-�������a<���iZY�[e�KSe�n�#�o�R��]�L̝)�k��. ����N�:�ǫ���q��?Rc]E��qR�#��ʃ���It��ـG���A<�a41�Q�P���)��4�2o5Q@�Pw^`�f~�H|X����y�=F����8Q���RQ.4��������nF����!,!F��=�<: %#G=Tw����,f�1�F\��&Y����{U�:�e�W�a����5Q�����(Qŵw�8 ce��dDp��0۬�������OS������Q��	�]K�8�2���½5�Glҷ�^���Z+�c�K&�~p�B$��L9�J5q�Nh��,��Ңa�{Q�
��$��_���F��k1����z>��H�� ��!�����MU��X
K���Q��uhL���;h r�$D��i���
"2�7i�~�~$D�ĉ�u_���	�]l������ۭ�\x�06K&�g��\�:���z֧�se1��v�M�t݄�[�^,%��Q�i�����dE�ME)b�_��`�u�@v�+b���ʬ)�"��F�$�����ͣ���8��T����z/�eWY�<�k>j�rbGsY7er��;�U��*>�M�~�����H�#b�;���� �S��~�iUF�L�j]1�#�Չ�����fɼ�_��z��"��J(n�}��-��0_��oo�0+"����O��˂Ey*�����z*�j���r�9*R�!��&��bS��^ͺ����'Y��ů
~��9��"X�QUG�۪C!��Z��r(��x�MS�M9!8E��#���h�2>&������P1��ɖ�<Bn�/.�"h�������K�,v�uWQ������D�R����0���N ����@��*�n/G��]@.�$�U�(�R��Ę7���x�\2�	m�^��߈s3�T{Z��bm�Obl�> � �GS$���h�Hz����CT�5k�m��9�v�Z�ڶ�?��N�	U��Xo����"�5�:@��:��)�:��!�ߺ�H?M���v�o��忉Ai��pae�C��ފ��׭���;����G4����:A���?h*b֋�U�Jl-w6g��H�Pk��"[U.8Cg��p���`�MZ�2*n�u]L�+.+��%���E�m^�b�Cw5z�I��� "7���Bm�k����^�gi�}��b�h���%��o(����	���܇��@�X�THf%^(�#�rF�s�mUt�>\Ce>%g�9]��/��T��3Z��n�P�|��^q���Q�{��`FB��W�,��Ѩ�G�ʁ��x����_Ŷ��9�f�E<4�EQd���^�h�"_�2�4�VgV�P�J1���!�к7�`6�.�?���?;i&AZ����6��gk����IC�P��,���=��_oWI��|��H"'��C��MO�nz����n���{`�H��O�X�Z��?�+ �b8��T    �&/&��8�ިԠ���}��%�b���n��Qc2hA%�����r��QS�=��b�����:�0�rmJ\T�2xr�$4��a��ߔ�b<��V�m�.�	�H�̬�󨂙 ���}���^
׉�[X���;����.��γ(5�<��T�,�d���! �PO�.�H�s�^�c)�N�J??�^b��?��t��YE<������p �2�6�Q�� 1��p�`�r^�����A�RF�m8�z8��-��5�*���������,	-!��}�մ�]�c�0X� )��4���Gz��k�+Z~3۬�K�oB��8,����ୂ !x-|�I���a73v�s�/wG 6���9��`]?!��ٞϧ��a<�e��B���5ő��wY�2����hSx?3�u��T#坌Afz��5��}�� ���ƺ<�ۧ�y�z�<���F���Ž��`���2Vmf B��>�v��A�Ű��$�����"��ܽ��R��B��!�z��ϓc���&<U��	q��I��Plc����B��r�Nܬ@����Py�7��-F��m�ҕaO#TeV����Gd|i��'~hh�t2.2�TR{%E�K,����Z��7���w]�L�����Q\:�E)��;1��s��:v�5?���a�{<1x~��0�A� ����繱uN�XQ��]�zP�5�oa�c���;69U�Ԝ٩y�O���rHSco]�a@.U7Y޿�Y�^�f�Eg�ڝ'a�7������+D��w."�X�1l�k����D�)��I��tW�<�ǣ�����]��e�ݩ��-��G��p��z��.	��m�6фӖTi�_#�S��-@��⣬���Þ��ϵJmN��h��H�lL��ϋ|�QL�ܠQI��(�75CpdW��H��T)��Ҽz/#�:�#�{-�S�n�B}l�?����T��ۻ�r�XC�e��0&i0��Dte���p�)�Y,�L��YlG4��q5�q�"w��ʒ�����!ZZ�����.���<ۂex���}Q[Nd6��>��H���>I��e���~\��VK�\1V��=�ޛM��Ғ����x�1�����#q����NÛ}�e/NU��L�c�R�uvͅ.��qP	�q��Y�_f��J�W}sh-�vӢơ2"�ӃF��k���	���d�?���<��Lēat =>���?͑R����2����bf��d7������p��%�>-�f�.�ďP�"P�d�	��pK*��]���ܾ��ÓŘR�k?�Y��>��	�QE����G�L�s���h�|yV�+���"��"�zƸ�F���_|�E[N��+�?}UR?ɐ�J��Fx\		y�K�x�#7is�FB��AF��h��U�7�7�e�D��4��g�T���7�Њ���F��1�W�~O�*��s�4
~@�+�_�ޫ��RK����!%GǍ���D��&��7���Y��66�>�n��$K̤1O����jJ�uӎ�1*(x��a>��1> cQ=0�d:�p9k��v�˙�Φ�۷]5�cP�QZe�&�v��ޞ�'���t�e@uVٍ��L�_�!<�,�j���}��Ne�N��R�(��	�+�vK���s�9��G�ɊT�A� ޡ*JG8����W�Y�x��h%���������x-��J�����7TO��q�O��M�3a���(_�T ���@��Ū>Y��B�T��%b�m�	�D���}m�n;�h��~�џ�3 <�Պ���} ��O!#L�u�KY�u�%Kmm}�`��\�����z��u	�2R�n@.=�s��S�,�,���S[NxK���܅4so��H����}s�`��CC # �/��>�������A���e};p#�^%�þJ'>y���T����Ϧ7�s�el(!���66E�e����!RZy�oq�,�.�����R�e��i�����#z�x�}yywF���0b��e�\��]�E{�V�j*O��͛�&x0&�@�C�TJ���QE��-�`�*�4��dK���̂g��ua���qe��b��:ӤYP�n�Ym���I� �w/�؅Y�e.b������7�P`����� ΪB�AU"���&e)rσ���E��di���dŁ�V�5�s!�0/����V�YiK�,
��.GW�5�ޒ�	}C���ߐ|z��#�~-�ސ���FYR��ʬ��8[��kƗ�X�
���Va���,~Ƕ��.���6�����c�~(��~�"���h+���W���,������A���Fii��y���&@=>�C�"�(#o`��wo�م�:��(�8�ۘei�;3lJ:���i��V���(��>ag�_���خ{.6}��|�k��y�Ô�h$���\�S#	�N.NV��y<]v�ǯ�������j���/�ћ�܅MWM@|Wi�K��
�|�/'���n}6{�����a?�-��>�XY�V'�&�%/+в"x�&�0r�8љK�A��D�����.� +�=.Y�/v	����P�B''�=���_��Ӛ��ѓ�!�%p�k�3C��>a����8���8 �ˉ�ϗ�.�r�j|�����������[Q1BV���0�=�����L[ۤh���.���y�Ea�B�<�y�q��X��#E�^��ف�c���Nޕb��d�Yr�����/&��"��<R���l���G�$	N���/q�	�0��FC3wn0��> ����´wQ�ɄcVFQj�b�mv��f���ԃl�-�����m>�*�>l�����Ll>WO�>�b�e�B�ţ� ��*���<	�^��-ޟb�&x�дc��;�ԣ��
�]�|1�٠O]����hU�K-��%��z�ȏ��S�e��'
�|����!�(�Hl���r��g�Hy4uՂ�&�?���uy��M�O�g)���Wh�?��ʶ��D�W�n�}�D�}���m����\��.*�*�o�Y����/[r㸶}���t�<�7�"�E�V�b8�/5d5`�6��|�͵��,��#|QQ�ǖE�ٽ��{Z����y��ٜq�I7�Q�L��"�x������Ѱ�^�#V�ö�H5�S@�!��.�:0�D�����&�8�c�"�ǐ���Ѹ�h`��=-��<��Dun�^" e�۳���'���݂���̋���	 SE�D�XN/z��V�T�)��R���O�֢f2�W��E��� OF�:�& B�QF��#؋�/�]��2)�Z�I�ׇ+�3�EQ��'���e,}�E���C�@��s<&�&��̝��4QWgᄗ(�*�?�Qpf�G��t�d�&�n���]�#�q�%�Z��ٹC��0ͥ'f�8O�	���r�.^�����\���pd��=7��%"2qS
���r��E������ل�fO�g��=o�@�95�T)��~���ɉ�f�`�u��4A(,�J5�����s1�|��8k���:�Q��w]@8 %�fez��7���h�0rè�:P,8%qt�d �"�mߪ�	'� t��Vy������x1�T�Щ`��L�?��-
=5�S��+�t��|\=$D|Yo�{�Rń	���h[�R]pXr�=��rzLU�j��\��֣~G�ж���NXrxq��B��Rb���˰P9�&@�,�a�0.���`��V\��1�?L.l����{P���-#�7��e�8Dv�� kL'���QyC��s�E4ӛ7�1qۧ���^ds�߁�D�NA�>pbEh����I�i�����q���O����a���p�R�'|��&�p\��\���_�y�@��n5�}���	�MLo�>],zX������;0������q����?�VP�X���Js�����y���3'*�.�Nkُ�>�x`���bmDF��c-��b,����Y�M�}4��Q��yT��V�!FP0O�A�,�A��9`&�r]�\$�DE���R9k���K�9�ԅx���dk    1Eqc���Fw�a$M��{�)S`���m���L��ey��2
DV4�5��]i�u�l閻Tg$2�i���`��,G˛k}�$e\O8yU\y�2��sE%���w �X�I���c�����OO�&͟�$��]�j�+�}�S�6*����vr�0�$Z��r2������I]o0��U�o��4�o�ð�JwO�pt��uG�^}���<��d�m:4B#DNe�I�Q�,D2���")���dd;u�!�,x�����Ry�����i>�A2=|�B�$(Z�>:f�8�)�D���t9Q�َhY���k̾�^V�toڗ�#�<MK��48���-D��R��qE0�X. y���ode�)�<�"��-[�p��sC]a��f�&�Bo���kr�  l�z�;�A�s�3b�߼��I���ci�c�Y.m���E9@������YxOH5NREȡ<&�}39�G�s�m'��Y�\_��Y�{-����"$�ߋ��MC=�M@�bd�r"m�!��N�)�F	�*~Q+h�zu6
Ő���'��~��o�����U����L�Þ�b1��|�Y���	S�8�X�VQ�N�H�no�(NU�t����{޼��I���'D��o�[�6:�����qcoZ��Kߣ�͑＠�:7�{Թ�7�&�`�O"�o�Q*t}0��QS6"k��n?�8h���m���a�l+���,�n\���t�+&X5Pǝ�'pb���m�Y�.��Q8��w���ׇ���9�li�5�7D=�T\�(&���=Dom%�n���Xt�s��6���s�$L��W%6;�>�L��`"\��$>�zƆMwF�˶�o;T5YY�!r�b5�l˱4k����?�l�p��*u�����P:��CsR���)�,a_��%b�$V_�%�N�{ Q�Vq5���̚������,�G��u�L�q
pe�xD��Y�����M\����������'��Um�jA��LZ�Q?�L&Q�5c�<x���i{Z<���**���OHP G�#��H��j�	��حe�"x;<x']��F8`Mʦ���:���1/�Zm���@5e2:�da���Y�q��bJ������&�����J��n�G�vg`'�(Df���-�<j�8�"B\,F�/�t���Z6�y{�]U�9N�DNF�mͲ�"I�g.�P���*���H�wOa��x�H�&C7�/��_ॽ�BnB�D�oRoQ���0�����+�>9BYEy����� �L�g�p��.Ǝ�mraSj���W%��*�_���V?�`c��P�8nv35�p cp�;=#���Y$��Gr�u&M?�'(��mI���ܮ���[��sM
�o��m��0P5�t�NS{!Z�z�d��B:\�3sٜ��|Fb?�ۗ1��0�&\�*.C2S��#c�<rfB:o؄i��ao�ʰȡ(α�-u�p����pb��tJf�1dIe&lS�0�3�:f����ٙ�lDt_��?!4�!�f�gYҤ���(�&�E�Ш(��X�{�k��L`d �A��/e��\�u�����g��v<m��{�,/����!�Z��"x�'����vC��_LuqU���3��W(Q������d,
�n�m?���$2YQ�}9!�U�X���$xW?��9���^;gH׫����A��m����W�ʐcs�A�>;+�jBϐ�B�9�
^c.{R(��lp9m�u� �#�t�Qo��_@,��&���,׵L���ϛ�;`�)�+�-O���5��$m2��ǁ[k�L d��bl��F�\�&+��+��KQ�c���������7�wN�*1a�D.������ve! �F@׶⳿ �v�������[|֫�8{��⅝��K�q� ��_�f?�����'�.�A[I�i����v��v�ɉYz.4a������ꪪ�
L�|;�F?q�^+��b({�>ld��U���r+�v':w�û��c�7k��H��.OR'�^Dq�eu�h~pй�	���Bi�,al#h�}�
����_�?��pYZ��&#�ˉ�Ͷ��L�'2D�n|�'?�A��V�[�]�{q�|����$�̄�T�sl*�4*�3�I
�RQr���<L�|���?���>i�ۢ��b�/��ꢀ�.m\���=$t�s�^�����#�T�t��B#�Z��00xr��u\��������+:S��$�CT���9������}ۿ�1l:�A���|�S���|{�_*�c��o�B�z���~�g��Z��[!V
�˾Y'��S�J1�� ިU/�B�&q�w�L�����ց�\O���måkr����Ln}��$>F�@yB�z��́q��6�5��"�����0GQ��c�c
�l�-���:���mO�����M�,�q��}�,�=𵈊��'�"|�����p�;"0MN��^Å
�y�]Y���'ǧ��fq��"�Q�TV�B���Sw(#7�o�?�eЯ��-�HRk�M��ŭ�����K���\�l����>��C:g4����#+���ɯ��ڽ�|�ل�N��Sq��w�p���k7yZ�����EI�^�>"�������O�<��)H�A��	�&�ףT���'b��<Y����q@V�Ot���l{~D��纏$��6�-�GkH�Ȝ��X�f���Y��Ǘ�S��{�ta!�E��)|U��D�:KN?T��.�Pch�̞�͒�@Q^vUkq�p�<+�	�,���g:��P����I`F,�
a��b�XB;"�=��߶�y޷儐�Y�B����ѽ{x��Gi�O�j��:@j�����!췯ْe�^_�fI���j���^����/��v�B�����y���#NK F��/��0Äz �D�@]G�D�щ�o:�0������������g������R�^��M���4�N���H[$��C�$����D�@%���1 ����1A��H{����
>;���P�#�8Q�Ȗ�w8��i)��}���rbRU�ˉqLaB̾�t봏<%\�t��c���)\D�&n���	��3�Z�-�X�4�.qo��N��d�fxm�P�:�\5����6�h�<�}P�l���ꗱ�~S6�m1*;Ѱ��!`�D�2E�z[�RP%rA�{�����r�H�g��շ�[���-v���f�z91L_����؍lٔnN��j#�6��8���2��(��X�ZF�<}AUD�Y��~'��șnS����
�յ-$��pfS>���&d�,�!���������=omA��H���'YMu�A�y�6������m�&o�pB��8s��8^�7;���lOy�@(�\n�p�j��Lt�=P�����4��־ϣ�����>�ŸEa�V�,���	s{�3�c��K���M�״�V�yIC�h��H���Xj�<�7�%℅hV$�G�E�O�!k�N�Ngzհ?���������C�O��B����&���"�����Y56e�F1P��5t0��3��3���߁�Fho1��u=A�7+�p�K���'c#�ijr1�gE�U�#��.�{zYY�p���.���/g���	�W��� c�g@'.�5�s`��1��t���hX�0U�O�+b���]�Q��H�hwϺ�ޜ�e���Rˇ��NT�;�� ԋ��ِ��L(.�(���"��_ma�/�s��㴳Ũ�i=���Ӛ��c��xbg�Y�$Z�u�7�s��.'�8�Y�$��D�1�' Z�l���M����'yh����Z�E+.�r\B���Y�	2�2
��f�g�4�sm����i`}V۸iǈ=!b�,�4MX��]Ea�lB���{
؟+��=<��A?8�&̝�`�!��2���&�5m^��m��4:S�f��� s&�bs��z���MWN�j�8�"Ƀ�n嶙yA)�7�~;�����rdI5`ǉFĲ�^�ٰD�s�e^��H
a�+Q]�W��y@9D��u�<�����Z���1�Pg���z�۟�_T9f!���Uz[���,    6�m}lмE�ӭ%�a�%���P'#Zu�%:��ϲi��d�#�)�J�;�I�.�zEY��I�?,���托�x r=��G��6�QW�7�;���J�9��C�DW{[��;��y9V���S��]=_^��'�[���x�� �q(�	�T=Ҏ� ������n��>��~��0Hatį��οh�n�9ϋ�ǯ
���Z� 8�:�� |��m�؀&6�A��N�u��{�ܾ��[Z�a@�����T��}�
���L�s}A�b��㠔��S����N��r��l�\E�ff-l��cJ4�k	. j%�C^yӚ�	(�t1{��V��i�fB�Rfe�8�i�V#��@��k2�6��)Bݾ}{���K]�*�u�M����yAE(���ݭ^�Q�fkF̣S�q�Cݿ G!�K���9��$�����˵di|��\�x�Q��=X�Y������t�����}�lj@�%ϣU��3&�b�1�ʨ����|E��K�i������R�
O��Kc$}�d *�A/�)8|<���g�,㶜 �SD��,RP+]eɆ�;d�@�Z�IAX��<jD`4A�F�O�$��S���@����/'}9��L�d�U�y�F|i���Q����F���␧�-�W�@6��L�[�f;�F��S�����|1�����ej�닿"N�Ч�2�'�3��9ȋ�S���.F,iq�L[w�	S�"	sO+�i/�d@l��V1���ݴ�X	�ܪb�'��Ӂ��6Ћ�f��*���������l7��1�nC�{�Hy�b.N�L5�����A���D
���6�N� )���E�<�q�j��`�i��EM/�t���d:|�>���A��>��g�8M�A��{�9���6�9�՞���K�h Bˉ�϶[-M=�㳨�ܵY|�7��Rx�ٺ*�8�3 ���!C�	p�>��ü�Ҝ�QW�S�Xc+��o|S�a?���r�n9�^6��X���Z�sx�>�wu���@I�,��XEQ^��0qY�Y�C��rr7���@���,``�{h/�@-�˙�S�I<�eYFi�QY|{gt�B����rAЩ����׻��Z��������&<�e��Nk�Ȋ����?��]�T�+�'�@����߰���=o���pڋ)���D(��h4��$��+��۰2)
�����lZq>��]�w�cϣ��л����@�x�iU�D��Vd�IyU2����,?�ǈO!���k'�U#�<��@Ky*"GLZE�EA\��ٌs�4[�?���6q2���"���j!V&��}��ye#�f!�ŭ�������
tH��V��'���ۊ�s��)Τ�b��r��lVxUQMqZ)�*)}�R��=������z��u��'ݫ؈c�X^��Ԗh�l��|�j� \�n(���A^P3���s�=���yڅ�e"O���+ݪ۟ �,'�֖E\��$��{U�y�խ=<:��T�La�T�:���$�{��d6p�����Lc)�8PC�-Z�c���d=<:.��@ ��{f��x�>���Z����C�/'�2�xye�r�RmY�6պ(&� �t�Z� 5)&j
9ۙ'1s�G�j� m�m�|�u����U�V�����
��
�ǎ��c�j��S�3�9�S�R_���ye]����>fYVx�S��m�d=��H��#�P�A�t�9[�^�&��_���s��vX�c�0PG �a�*L��`-�H�<H
��rr�����/'tZU^�^<5/t��^���Ѹ�g��n�P��C����|�I�ֵ)�	����Ö����ϧ�mHFEY{�֛O`�ٺ�i�4�ˉ���[�eS\_�We�D�Ȫ곩��-�OF�/��m �I0��V��U����}�Ӳ�D��PU�y���E�+����Ɩgx��^�3
u��cFC�l���ɔ<�i[�l��G��>������̫Ş���g�Ոi��4�"4EhN�;E�mp���}�m�{T��(��g��l��MX\�4�1��0t[�"T�������FY]f Q�e�t�FF��;O� so1�|��M�$W+� xU���d�N1�,@�J�Pױ���2 r�b��m��^�Q$�`H�~�|T�]���w��|R{'�х���$.G�Glw�?S�JMWO�v�Z���d�7���C ɉ>�C�Iƞ���e�q��Rή�:�R�:�7��e ķ���Pǂ��#B�p�w���}�dU��+>�^\�a��)�`(&�Ο��g�]�U��+��b؏ٌ��y�	�a�_���-�������de/�(�T�K{٦���#T��c�������J����EȆ���m�;?�r\%J����!a���H�J�+�}��&�����W9?]�����z\��J䢡dD䏾�zZ�4�~<{*�t���݆��j�v��MM�#a� ��I�n�0,&�Ǵ,�°(.@���{KĮ7jay����9K
D�E���|Z[d��X�(n�����0�Dw�6�Z���w�t��@5JOy�<�1jצ�>��G��o���U9�z�T<�iCe8�E�����s�G�s�N]�z��A�OS�D�D��f#T`��{H���	;�Z ��+g'ק� r�c���]Ϡ���w�tio�b���։M5Wu�	r�/��^�����Ʃ�n�ږ8�C]������{�CB:e`%��/�8��!�L� ��_�5��<M}@+ۭH�M��,+��5(񚜂�B	�:��s\��4���TC|Y��%W����Ǹ�:_�S��z�?��T/��� �:�Ƀp����Lc�Tu��4�M�ܩ�2>���sQ��&��	�L�1r�ޙؿ�g���-��&�+���T�aLC�;GH��ߣhǔ8�'}��~�>��W\oڮj���[�U�pe�m�J���`;�����\�'�WE-�l���>BU@� �~���ҽ��m��A�S�A�J���«_������|���oq/��P.���?��7����7���Lǡ1�0�g'� �!���(7J�(蚭�?b�����3��ah���~��.	������ Y9��������i���S&}�'E����d�Z�`����d�f�G�x9%�٨~M�7���8
��g�2���t�,�h �5A��>�Y���}V��Ak{H�����o테��>������/^����R�I�i�E��m��'��	�Z�B@��SF��l��6J�hB`�(�}"ʂ��>��Tgp*�h8�Sn F�R}'Av�ai+P�4����H�sf�u�cC�2]�4�o���I:a,��E�σ �@���5����"(�\y�
)�ٝ^_gC�T0��?z:�����n�Cb\�ӧ?�Vw��!�J&���G���N��gO��1L%<�|��^�=�&�_:�F����0<�爃�hK��?��O��N���� @>�i	�yю�Og'������G�@߅yIIU�7����?���Uק��S���_�w��i^��"ɓb��3Ɋ��r5J��#��"�����۱�p%(	"�Z�C���'f�W'T �B��.�b=�l�h��}v}�Q�=@�2����(�=i����u��#�Bx;!A�R�)>�j>������^m��)�OZ&^m���7b���E�׾9�mG!7�Û�U�*�[. ���:6	m�I!STv��$qh� �� /�9_������V�»�A���Hk�G_@a������oz)3��ز��{�����u��&�����o��d*�<,Bw�(��qL����[����w�y�8ѽ��ݝ����bm�l"lmY�)O��S�VhU�cc��@��̠��	�	��	J��9=]V-&#?������p�K��ݐ�J�O�a�#Uo"�c����1�o����N����V���ۦ��	�K���J����m&�
=�V��=\�-��@�|{8?��`/��X    sW��g3{k�ΔfB�؛T�sUB�g�{�U٪��J�$��l`lq���l�q{����V��)��]_%�_�8�"�����G����YolZ��q�=1�'��P\�����XI8V�5}X^��(Js�>����޵ ܶ\�{)ąs���sF�����
�Y�!v�r	�Ϳ����	�+c?�^Z��^V�6�-Q���۰� 摑G:�H7٧��0/�s��S��B�#f�0Gd�3R�M���$�p*�4�$��
.�U�W��/��?�n#��1u��ˉۣ� �dw���ն���:�����Mw(��C5J�z�·�W}�9:ѻ�p9��)1�L�u���e�o�a����:h�T���c� �K� aҢ��_/��F)V�r��Q/�x��N�+/��={xFq;7msl�j�u�|S��>u��x�8��D;����G��S����|��!`�H7�����N�
[8���X�9�^���8�Z�s��PC~�x^�I���]�a��Xj��p'�7j���Vt�:<��I����I$b��kq)�A��o�������4 �bّ���z@��1���O���)`��U!���d������u�k4�����)�NO8����a��G0����2 $��g��D[�ԇ�l:⋇�G���p�o�.�K󲝐�S��G.hq�J�$�`xb���x�F�[YF��r�s�]�v�����ʳ*w!J��@�Q2�fQ��l 7�`b��B�]�P2�Wٷ��4%�ρ^Z���j~��@k�E��l�fvCj�щ,��wJx#u^�t|�.�>��B�ъ޾B�>�v�>�J�<���N*��cw�8�B��T4߰?��0b� ogJ.B�з"p�RC�1��4�P#R��]+�G�zC7,))t���V�����^�\K��Y*G'��͝����c�DI���0D��Qa;1��m�O�i��/(�@ <{�����L&�I������A5��{G��#��/j5�%�wnlG���P�=$�QQ��*���5�])J"9�Mo�Y1�1��c�$���W�y@�H{'� �\c+"q(�G���U�OP��{Aw��8�T����)�kx1w����,3
�$ey}�Y�g.�Ep/�.z�ɘB�G�3��1P{RE>+U�h�=��!dZTҵ�o;>��v��nMj�jB4���2x%4� �vSK�J��r
j1��|� ��Q<!��y��{]��4�/¢�2%[� 3�R��\GR&$K�B �P��;?��ފ��%�A�L^�@�]d�j@#����Cm�nPj�OT��;�HI���O�+A@��bdY��>P�ݭ>��� D�}u|>���^yY�C����,� ��?������X�%�ӎ�W����
X�b��t*�U�F�R� ��@;~�.�]�$���X��ڢ+�	����P�2e_0��QA�P9:��	'!Y����8&��z4�};�߱$e������+���xl쩭;Ui[�4�GOY�N��i�Eƾ���:W	��#sp��{>����L("˪�a�8Ⱛ�1%����=5m!x;tj�g���V_m�&
�^�4f9l����l��u���$E=�!��(��3	~������=�lV@���o��k6�Z��bZ��mO(X���n����������L�*�9a�̽ !yE�:�,  m�|��?�w��|}��>��7w1]�߰��1�Q�P�a��ȕ� ��oG�}.�;�����K�FLs��uJ�FO���F������-g>_Wh�'D�����ڮИ-N�x�m����|��<����e�A�󘥏۠�������~N�b��|��f�d�Տ����i���E�̽�v1^ �
 ��Q^�ӫ ��b#��4���>���9��0r�:���-ㅐ�#���A�T���[�$�h�\p�.��]Χy�mK5u4a�RDi2�/^�%�_,���PcÐ�=���Q��J�T"Cܢ�洳��(j��+�4Ɋ�_�2x���h��~A�\G�|��1��8=�^{uݝ�q�J�w\�ܭ����%�����n�s6(��a�uk湴�[�ؼ��`Xp�Hrh_��Yk�T�a��h���X$����v�A%�X�<��fDm���gW"�*�P��݂�{��	�6�J��p�����k]��/�Mcn��c��/5sNã���'����z|��d���}�lG̈́[��Q��B�
~�nD���~2�GҰ�K�L@�������$j' �Ҵ�|9���׀ވ����x�J�&���Hǧ��3�´���|��}����[�4˒ҍY�(���2R��T�z�,�����A��㺭�/�t��c��g�Am���w�=�0��zQf�h?�0j٤o��-�EӞ(w�O x�b���0[ӎ���rO�U���e��3Dh��?'��d�#�?�[�^����,��%��N�T�ON _��d�� >q�t���ٌN���P�J��Z��R� �ӎ;�;���ʝ*��U�Y�V�W�i��Ĺ�� V�����cL��)�+�6�}0s6����l�4�J���~Lg��կ4�B���		|7�唶�q�d�Ҽ�B�$p,|��ڳ6/D�hY�
��#x��kU�7��[�e]_����&t�0ns�K��cz������
2q��L�y����@He�@���������>�T_�u2�f����]����Xf�@ލ�a�_���#�\�:���:|Ah�+a��u^	�A���T�/�W���"{���$x�'j|O/	O���M�|.�l�@n5		����kV�^�ǣ�����.G����`�ne&��H�.�"x/MN�~�Bk��2]⠊���:֕+>���|k����4�¨(ܒ&.�߼�
ɢ���YSU�.Tn���{��ŋ0{l)>��V\���6�fB�
/oT�U������.gl��'t������js�*�y�v=�����4�w�ŭ,*�HWe^�D$����Q8D�8J<W��,f�:c|0S�����t�*ej����YG�]�F�I��8@��e#@�2��Wͽm��	�~�d��'q�H_g^���ٝ� 8U�����y����pt2�����%�rR�3���0������4N�l�!´�Po��G���N[�`y�
���gلd��Og
DZc}�d�삄}�%���̤�Їq�Gkf�K�I��|K�HGs�I��;x|<"��<e����'�}YQ��8�N���r�Dҿ�k��a4!E�E�j�$�-}�OI�&?��X'o��؎���9�s>�$���_���R��g]�-ɖc��dRއ�m�&����KJ��sMIC��;o��p�F\�k�*f��	����IfY��R_k���L��1��ڵ�n��Ww� �P���s���a[t��ж<ʒ��Up��%4B���ҧ������[��?�F�<��1���1e�hي�Ȩ ��y~���we�\��8�R�>O�����?��ݢ�=?��UG��%-��-B�j��CZ���y�>4��L��1tg\̢�˰W^�k��Q���G-=`6�_�[
�ᔊ`�E	�d����t9飹���/�t����w��4̾W[�ݰ�#�-r�v�������|{D�Fq��j?��j6��&�d�(����if����R�I�j˷Kp�[�#@��[��kp���S���2!OppR�5	i��`�qEe6�y)O˰�!Mm��ٟDEJ��~C��AtQL��c$9#N����֫Fq��.m�fN۵L���p����ipS����:��*�q�P-F8��}��*�@L��Ȗ�.Ty����b�MR6��Q�I�ö2�6�g�P��tA�>JrXL�(j����a��6��x��r��hF$��ɱB����Ŗ&�M��uc'[�9u�	w���9��}����?�Z8T3��/p"������E��+m�]}߇y����بj"*��t
�@D�G�3'��DϤm^�E,n    ��G�=��P�2O7@I����������v*�ֈ�TMG�Z�.d�'�� ~��!�}��p���Jp��m^��0�Ϛ_š�e]J�f���/�4~
z�)���-�b@������1w�A�
b~`���X�+lڪ��+����,	ު�#:��}8�r��|����+� ��}�C�%8Ӈ�.��H���I\̅��#u�XE�s�, ���.��4�qvޫ��
2Nl�)w������~k����gDDp��g��Q��};!�E镀��[�;Q��A�	{ı;�lh��{�D|�Ŕ�f;|���	�I�Q ˃�mN��W4{�����Jݭ����{��8N�7P#]|�'0�n����Ӷ���-��ǭ>���ȭ	�@+p��*����f��{�!e�)Xʤ}�;���P�A�)\�ݴ�L\x��*QoO��2'�������/�pI� ��,?���F�#;���;$*�e�pQ�@�R@lj�GNj��l�Spz�З6b�a#���3X؜��a�Ny�7���<���	E@SQiB� �J���4G2_,+��*f)z�l̄#����ғ��"Å���w �Ol�DՊ��2�8�~z}���#`bωK�� g��J��|Jɫĩ��@�~��YJK�q�t��Mb�X�=�@W�i�O8ueRxP�N���Qb���Z� ���7����G����\l��9��/�l9���NXWTom���N�#���Id��� 杠��N�]�� �GEǨ����z�T?� Iǅn� �h/�f��ݼ:J�q8�UTy�'gy������s�N�m��G��)�� >�Ŋ��ț�={��R&#C!O`��2bc��r�n�<�,HN:�E����Ƞ!�0�.�*,]Ǜ�5��MH|�yS��k`��g�w�_��Vkk:��",_A�/0��`A�I��q�������2r�X�W���v�seK��qgL���PP:g<C�Q�ފx�R���l�f��c��*�2�3O-����A��K6���`�H;�_�����=�'@��x���k�j��T�[/��g��C����`S�i쫽��#6;�	F(3_~�jg�h�@�y'�q+[�[�r����e��2����b��\�(}�Q{����2o�Y�}Cߍj躘�q7�"������(ITT��h=h�_uˌM�c�������"�K�?>��h^����8��	�5Or�cΫ�g��*���� �]G�#|�=�-݉�b�i͗#+̆�J��L���Ȕ��a�5��� �ܱ.�R���p�� ę,�qn���2oy�� ���]>(�S�������Hn'�A�b�BQ�O ���J�d�2\dS�B�JHD�w	�I���nދ�O��H'<�%(�.Xq�N�Y��c熨+�[9��c"����T��	����O�O�����!��>  <*x)m��4�՗mś4L�tMC�Sx�A�e��zp����'�V_�_�sw��;;O�ʉ���I&N���M�pI�K#[���o>��@E���Vc�Ҩ���c��޺�ݿ���#U�+���7�8s5T!�6���C�>d���V�'��Q��v1���м��	�{U�**����Y���3��_���Y��>ۅ�}��*�o`Y����x�D�H$u�2m�G�5JBC�T{ԜD��@���T֖B]�.��J�,W�ϵ�J �j&���;>�Y@J?�Lp�mMD�|���s��d�������K�"R���3��uj&42U�ũ*y�[>T����<����s2+:N������ư��
K�M�q�>}.i�p��8*�kW��J��k{i�Kgy�FF�忛���(�4_n��<��m����D�D��Y��{��<
�_�JZ��f	!<w���}�6��["��z���:��*��ݬl:չ���l�jq�ӅBL�#��E��c�	ҕU�~]�X�@���z�U��wCCWE��M��!��������H|���3NN�.��UW��dw���J�Č{�;�r�#3�'�⤟p��0�|�ҶR�`�\#ٌ�3��V����:�>�=�aS��a׾�k��7�wt۠����Mݼ(F���O��y�$.�I�eەF3J���D'�����t.��E>_2���aUi�US�pQ��{��4�J������cB,��W��S�MM@�We^��e�g#֪���0 �
ë���>�sz��J��"΀�&�M���D����`�ߧױ���weT���0#��8l�8���Hlє��yp+I����.e����涵�����c�2>�z�:?�	pO��ѷmh�v�/�p��{a~}��ԩ?��\\�W0�Z����+_����X���[�h�kZ�7�₷�Lo���e8�.�[3�1�z<T<���W ���c��C�ڀ9*G �d� ����_�g� !t�y���K��7N�F��p��>��܆��t(���t�����#7�b��*~FMX\�T>���:�}��mX��[t��4�e��TE�m���ϫ/dZ��phGY���U�^ő�"5�1PW_�Uo(�R.fo6�:���f��/��%�O [��+'p�����P.�ٍ����S��J�\L {>8sZ��յ�\�݆����y:�S��6�������Y*��d�u���'�mt48U�~�X۞�<�'A3�q�va�
�@��^Y1Rn]w)��7b�+��#Y�0�`|��6�����>��&�W_������{�t�)ݦ����ԗM���t�
&�9ѿ�����s�l�)�|���3�^�,������`E����d�������(<�Ƀ߭~�A�*�j�'��+�h�ȅ��ĞO�)��j�&��ʼW��DbEY_�ٛ�172�A��B��zͺ�ݴ���_r������Jf��eQ�&B���B�6;jV�q����D8oQAӄ�p��KQǊ��2Ob.YF?62+��6Y�O���$�)&s��g��I2�������^�*������K;g����T��CHfU���@�2��ѫ<x�]�ŭ<n�pލ�Y�'NҮ���:}��`����I;C�ѻp���AwRe��س%a��b���Ų~GG�뺪����Ja�����CJ�ȗӡ����U�\��EyG���+f
L�u�E ��kyZS���&�mB�����u�����=4�X�>&*��>�pԊ��䵪
>I�%�b���ƙ;�f���S޾pI�DUx}w��/�+���@2�Ҿ����ٺ~r��-��Y�1�[.�X�q�@ت�B�Ӹ��	a��\���\��>�N ��%N��>s�q"i��tz���Q�37{�w�v�|�x�	_F�_��I-�϶�γ:�&�+U���UTQ�0�m��\ϝM�`%�!��� I ��0#`g��4�t�/H<|r��q�W/��		6�Tg���Р�R	��J�9��QzrG�&�D�@m?�ۯC��0Ei��/�M{f+Ɠ�>��2HPI�0<�U.�A6�u���s�?���8̝�Sf��#��´������]CLқ����+�rBL�<�]L����؞m 6��w'V/]ozEM�ݪ97{�.�-t?��эڸ�!�o����b[��*���2
���Ö��F@���x2��H���]P�s����b��|ۜ�1i6�J�ҡm���l���_O��:���{=Y@x���^�J�����e�w�T�j���(�Z�~O������qM�(��F�U��EMa�9-X�P��Vo�i��*�n�枂�<o��-� ���� ����p>�$u&AU�>�{'v]������ ��N�����Խ��]�؆l6I�ܦ�x�̓�y�UQpf�7��� �"^ȲX���f�����b,����ϛ��=t��K�3[�A��~8�i�e�Q�]�\?���d6�8�?Շ9W�|��KzZC�ƶj�+�{sp��M��g�b�I��zb�*���ڄ�z\Fi��f�=,�GE�ur����ns�������z����x    ���q��I/��I'˶��+T�4��D����"�g"� /������������q	�}\��W���q	��i��u�]O��xJ�Z�Z�E8�V�}���:Qޤ��V�sD�qZN�y6u�"���/	�(�#�HI��Չ�I&�g��4l��Lچ� "gϦsѶq�}{�����zhT�x�R�r��Έx�� `�9��(fJ�tn��≯������t�%UTB:�I����vH[���|���q�/.��\G�.ւ�VI�&����� �E�5фx�e��qQ�V9�@z��J�?�]��#����:²\���W��߰�����$YU��?���s;_rOV�B�m>:H,��J�0�bM��������&l��g��\o��K�*���?�^��|xDN ZX ����_}�x�� ,�h�� ��	Л�H���*~&��$�:�����3�"�Jo���Q��x�.��k��A #��GX-���0"O�,�| ���j(.P��u�=������ጺ��A�0���Ĵ��	U�#dP&a6a��ت��qjC���iP|=�klp����Dod ���&��T�k.%����w�b!]�[0�S4�H�)�Sr��sy(��
�S" n�@��q�H��N{���^"ùC	9D�49pYx�-��L���2�^�Ci�ئH�c��'$�Q�`��]ta���8�+ ��1b�/}:�
n�ӕ���9=�'o񀑊Ё����QN����µ�������*<j��ྒ�*��p��X�7�*�(��|VU�۟_` cp���s&��7UXVoh��%8�9��Y_l1�(��X���
�&E7�F�2��@"��3x'��U]�T����g�NQ�)������� �֭�V}ᤖ�����_����<���~���@�:qh��3 �GҬ��Tb��4�$+|uh��_V�n��Va�D{�׸�"��I}0�q[LX"�ʲ��͢��w�x����h���#��pu<��^��*����^VZ97[#Q��&D(�K����q�W�Q)��6�a������W��4����w=�:��G�����Q��Bu�~2�=x��"m�tB|���Vq��i�ǅ1�k80�S�x,&'1c�\fas��?��,w���
�PH=3P}V1�J�J⍭�hS5��A{��	ĳ֒�c#�Xo;�t���=��Gζi.p	�}��2Nz
a�R��;�(�����L���33�Gsy�),[�l�0K̚�k����4/R�H\�d�3��57¤Ԟ��T��^~�_ C�����#�y9w��Jʼ�F���a'�3Gx0$�]�@w����,ζa�u| �0vu�M��y�9Jw�$��#P$^���n{/���AXD*o���^�_��Z	��o�~�4M���WT��s�4�����E��G]��|�ە�������Qd��3�S���>е���DZ�a�
�$�qS
�7=�B�ߋ����E�Rw�++0:l�O�~.��0_ER�6p׏��2���.>��6�uH,;M���#��,�֚�YEu:��(�x��Ep��gVnI��y�3#u��ҳ�m����>��q�o_��J�k�W��jR�M��3�1�� ��*���9���v��xr�FZ��:����|���T��󥎇n�< W'�N���bI_���1�;�A���1����U>�NL�?��L;S�x���l�*�Ȋ`>Q�����x��Ɗ�	O���6�[�����P��Ij��W�R�|sG
^��em�.,'�	�@�?.%�;�}�A;�|��Jdg��V����b�u�x�:{��Z(/_���)j/8��r���z��v���m���<�a�`�f׽��3���2����`?t��ԃ#�g��Gc����p��ى����(�W�G����.
�9B��W������L��=��N�6�,i*��ڠ�FG�$��~=<�����O�P,�Yy����LB*ҡ��C�F�d��u�$�&�/�,3��`/&�~h�m�� �
�� ��+n�(�rO��C�!-FT*{45N�rR����U�����=��;���K��8�u7���?0"��7"�t0ԙ�n������>|�j���mв4��� ����^,$��WA"Q�o�Z�z <D!��9�V����U�@����i ����w�Do	
�Jz�Z4����qh��^n�J��>Y*���	���ja,��B;�Ada�3ӈ����0RN��a�mXu&)'TDy�9'�*M�S�d��2Y*J��ʦ��A��f#Y����L�=�������S\��3�-[𘫌]Tw�j��ck�/R�k�@�!�U��Z{-S�&�P����j%�4��J�������|��y���y�/�:�j����� �U�X��VL�݉����DSB1��WӶ�gى�'�&ݭ������ �p���eS?��y�(��Lr��	��=�*ӥ�Y��������{���pD!Fi�e�m�
Y=6��?	wU+�\�x3b��R�l�������N<+���@���|�	���x5uÁ�6_'�q{/Hc�͇d�m�"U�~���=�Ϟ��
`��W�Jz�����ZT;��A����7�̈́,\Uy�T�����@�{�R�/�}�h�4T�ݳL#R�b��ljGu^����Mn�x��U�'�%w��C��j�2�1R";������h�&��ģ��{�>�a�A�]��l6bF]tY~�u͓��TY�ӯ��G�q�+�V�Xҏ�7�Y�%J��m@�,�-#�����#�����s�z� T��ɪ��Ν:����v	E�
�m��������z0'7�Q3�������6Xz��u�JNT�ٛ'[]X��c�=�@N����!FaR�܏Mǋ)#+&~5�nd�"4���	.�:��eһZ �?j1ݼ(�X��X,j�����,�B�F4�������i�j<����Q�/l�������m���TO\,��*�J��^Q��x�k�6d6�e]癉'��*�c���O�F�$�R'�ZFC�qC}k��Y���y�����p2\c7�-yua[[������@�!���PZ������uS6��Í<+b�̒����(�-�G�h҈W�c�L6�oH��4������<�N�v4�8��>��=�uDM: ��W|��4*�yv��Z���Hs�f��������1�7���+��>��C\ٮ�n妳�i �=9mzxjokb���'i��iO*p��~�~s�_���������W �|����AյՓ������T��JP����S=���e���ܶ�&ȏ���m���j��2�e,U9a��,�fCz"򉬋���@�_����7t�}Y��9[�^w�L��͋�c˲,xmZj,�wX��C�eL_�6"�i�ˇ�b��.x0^��/�̲��Y������3��}���o����kpaF��у��ïսM�`{+W^�x"�!Pˁ�g�4aQO���M�nE��W$��@C��f�1�	���Y�K�?��aF���:�[K�r!��Rc��
�&2����K��� :�:iSuӽ#���N��J�ຐ։R'�Ʀ�a�to6"�1$��tC<������ob��\�"���a��*��M͋M�>�g��c���F��@�b%�*v��rV��
�4
'$�"J��]�<>�̈́�������^mV��4(o�cRsѣ����fSo���
<����m��˄0z?�*��������9�ų��QD��=�Ky�M�q^��x��I���՞��=60�);�.��~��>�t���� �G�CB׳1?�7��No遃/��3��}6��K�$�1N��k�坥�#�����0�\}]�,9�]�Ϊr}��P����Iu�ı,�v�{hOD�Rr��8�l�Ȃ��D�����,TAP�������(u5�u&�/k�ϱ���d���ⱆ�!�sb��ƨ�iO��ѧ]8
 8�	�̶�h��O���m�KC��Q��dv�N6�&O0��J0ݐ�J5#�    �&-'�:W���q�^��.ʬ�#ۼ>l��!C�4o:�K ��a+.t"]��e�E-��I,�V6[KۆE3acSTi�6y�
[�6��c9�O�8nN:�F`�)ϗ'�Ȕ���)�ă��*��"�Q�I�V�ꗗ�cB8���#´�A�l�6��	<�2JJ?�+B�aA-�[�"LY�	�����p4d
8��Z_��_�֞X��Xl��vy2K[ڦM�]_�����6+�@t����
4����56��]#��2P(1eM$�����qD����Z���k��f�\�$��pT;���%�
o?�DY���D	�n����EC~�r�L�p��0��Q4�	�!��_$R��R�96��ή4_���D��&�ݖM֦bXV�T��;t6�q�*!�BF�^,�U�S�OH�,6����qeu��)#�vEr�^�m�V����2��܍��&/�j!�:��/8!F��J��D#�Ml1�����m����2�����<`�>">|�]���J�uB[<O\�9\�F�bwy��\۴m7��e��E�F%����)w�@�X�:��ֶ�<y�����&�ǰX����4O�ںo&��"E�{1A����n�Os�ZL�Rxp+���p>.Yۙp��qiK:?�(*�՛å���y�����0A�}��h'Pi˲�=B��/�|�)`�28�D����	kjÝ���?|����-C�L!�N�y$����3�}Յ��	�w�"^x���/Te�z���xICu&Fk=(�6�����,�>�ۇ�uQ\O(ݪ0�}�V���өn�����^J�J/]�#.�����wq�OPة�(���L�W����L��n�!������0T l���&��;�SƋ�g�\;[��HV�_2�i��96=A6��nf�V;ٟ o{:�����c��0�Λ����wiOp��,�\[f����Y���l7��40��;Q{@�lE�>`;�n���+ۗ$�Hn_����bB-[%IU�K��� |�]�(�I�^�#XD�b���(�]n�	�'U����Q��&��Ghi^����l�ɇQ�f34�J(D���6�s-��2i�닳*��(��� J[d�xwDg#t$q�ɵ�̏fx��V�>���2��&���<ֲ��ϨK����V�ą��o��"K\?�������(Ok�}��\4�[��@�����'ꀢk|�]������hM?M*{�t|��	~��-70�Řm�m�E��\�;c2崥In���t��y*�Eæ��˥���'�ғ�d�����.�(�����Z�qO|��1R\��$勪��ҹ�Ckq0*�S��U����:+' il+�xtBo�.A��0��D-"r�ӿa<
a�6�a��U����5M?����4��PUd���ÙGt]#�9<�����K��4
2 gcz��_�L1���cߨ�.>�� s�d�.�& �m�T�����@�R؇�zy��<�܋����*��J���ë$�ǀ�i>����5e��!&�uR�Y�u}MȨl)�uo�4�	M0#(I1��"�&}}�M���W[����mB̒�W�2a�_��Z�B��ʴ楑�����=lGF4b�޾F���O>%6E�͖�<�b�݈p�%]��B���N�L����X�G�W��H�S�5q�$������k�U׮W���B���!�����W\U~��~�DeY^�8��3AU�H��<*c+��٘S!<S0F���h���[ 
���QQ����%՚�$�7�=�џ�T�)��҉Վ�BNXIC1Q��lو6�����d�w�{�V��5�m���oԖ����ƨZF�M�K�5 f�$�e�Hz2�WB(�?e[�5��͎0 E�����xLŉXea�C�X�9�Ѥa�O��qyc֪rCl/	�ƌ�]9>n#)�!�o�'����E�'[!��rV�sէ&�_�\�$�L(�O���,����
Z-��(���:�٠-&�M�^�4���G&
����݂�C�_����� ���$o�y��M&]=!&�߰�4�
�H�eG����Z�-�c(�}ԝ)㲟�ei���
P�-:w�͠s0�N����Ovr&^�� R��H
 �u ��Z��[u���\�ڋ��%�U�u.eq����P_#{!������̸��͓�a�+??�`�#��7�5u�L9�y�V��\8aO�kS�	��7�q�;e1�،}P���T�& �AɃ��+�KI5���m�!R�O���0�?�t�#�z#gi9v{F�	M�uلR���h<KEpo�3+���B������Z?�i�8�?�ڑ�}�k��c������n�ܜ��(��/V��6�6]�\�eg�[��]��F4�V_؝�@�φ����+4K��͹{[R�r�Zll8���e��-ʓ1�V��d[{Ez3�Q�ۨ�r�KA�V)X�y�>h3�T���/Թ�3E��لb�s���HOq�}�ǋ=��w��miN]�Xc�wo��*G�@)�,h��'�7��e���'&	1���>QO��(5��XO����RNDt�L��r�͉�W�%�V�8U��%naAu���v��q9V�l}ii~}����i��9~s�s
�_��sZ��4��k1'���G��X��0��Is������"�gyg]����S*�����lx��p�6}.(B���6=J"�z� Ł*B�>�A�s������8��TA=��&i� p�u�E�V�	�9��n��2�^��jh`��Ω�c�	<$N�����)���~-/����(J�ex6t�^S�<'!�o���#�d����\��=x�/(y�u��"��u�8P�����1�C��Ċ���#��Χ�n�;��������/��ْn��I���-�pN˴��a�� �	��1�=����ퟙ�X�9~������K/�*>_�L�O�੽�c�⃈�@�0���@�IN�:RA�%V^��{�U~�K�o4��X�R�ӑ�����,}Q����`�e~Kc��z.�
}�Y�0��;��.��\�ƺ��� vJqc58$�8`��-�;U��Ԇ��W@Ԗ֯��9I��k�
��ޫ�f��%�yo-�}\:�n�l�x�	[��w�F�D˩���/�z�0�.��-"�p>�����a���]��`|����Ώ�kw��5�0 ��G���A��ƨ0đ((�**U��*��xA1�6-f�N�֨��&�a�������ׅs6G�h�ŀ���ϮJg��[�~��7֘vB��<�( }:;59yī���#��޷�OL�O0��`S����onc��mx�[�ivQY��ȇ�t�� �/�C"�4�-1(ˉ�ϔ�mP��(��I�$+�1�T�8�U�x�(�Rd����m���^��P`-j!O�y�/��5N��������_�E���8^���@>�F�X�� �ۨ�4�#i��K�փ�U��-?���y�m̪&ή��Ef����u.%� P��y��������ToW/�᭗x6juu��Q+�8O�m�i�Q�?p�l�#*t�tX����6.MNĥ���iJ��`e�sL7 �xt%Siss���L� ��k�	��*��WTq|5�{�I�Z�;w�� �YlR/%��k~��w┍�FzR��l�̀
<�5�'O@YZ�4����(��4��� �s��}J]{�?"S�r�ؚ��隶!��^?��D��»��T����ދ�,�|P@��hS]�,[EbA���٭��P�C^��?�.�M��_H�@0~��q��p���V�3�&���O_�e��q��u�M��o2`�U��� bl΀"�-�X+�*��u;�^Fv1<�\�L�>���I��픨��WMȷ�!��;�yWV�~S��C�/�����̴��ʰ��xB���Nqaw�3�M�)�����f(��9P���\B�b��v�3��mآ2�&�-Β|L$e�⠨��(�PQ���z��^�������Rm�iu�,I�2OV�=�    ���J1�6��E�#S.�����m#��Q=!�Q{�I��P�a��e$؋Ժ���NW����b${/�hվW����喈3�5mL3���bZf�?mI����!����V���Ls}n�n����b���*�XG���Q�MO�%��<��]9�B��ļդS���R��h<�`��x;�d9��)m�0j'T6��&I���VӵE��K��#f@8[�h<6d2+�����@�|�����f�Y+�|&�হu��Tj���I%'�3���r�نc�����IQ����C�ö���3�9�HRN���Im�s���u�,f�$uY�2(��.�'\�27�I��虌J�W��`���<�s��~ �@{P���3�g�u��M�<�z���� 1A<��Ҵ����5�Y�Pt�9vz@ybt��߆�P��\���^nwZ,������ڋ�%���n���`d�z.����4�4߳��~pW�C����I�(��V�34#qF�V��l�]��0��e�����D�#��HC?�u�V��cڋ�<߰9�I]NIq��ޘ��pӫ$�I�����*B���cE+wz;c�
�+z%B�I<��E3o���`�.2�$i���Zj�%�9j����2��hn�������m��
 1�|��y�>�ϛ���g�����k#l��'D�L*?BO��Z4�;�	�#��k^���
����ǝ�zο�?'QO��'ù�s.n�g_���iT#�.�_���s�����{mُ2 ,O.�ˎ,�*���?�����g�W����l©���"�Q ܟV�1u�p�)�Ɋ~%Å�UZ�O5�cw�u�&���_����O���Lg����m��t�t&M���mMoe��%�uη���d1_��h6$Ib�		�^��!R�鉯e��-8�bJ?�"]Κv���eU_�~H�0{�4��ɖ$p�4��d��]Έ}��`�$f���:�pX�zG���$�� .�u�T��*�oU�%���8�� (|������] �Т�=`.���=T��<��h2�=PXvc�0�+��0�Rb�o�I�Xm��"+�H������^�~�@���eK>iC�/wI���#4p�V? z��V7�*�>��x/����L�'���jOq֘t����H�H3@��\ɺ�9�9��Ӽ(t|��M�=5��b��l@�8ö́n;ͳ��p����Vu!��Ykq�8��	�B��սLE�}��s�m�l���h�xBX�'�A+�>�-} nG콟���33�ɮH�ZT넂�[NF�Ak\��PZ�E�7ji�G��LU9����n{4�ԝc��7���[���q�ھ�~���i52��*xeC��/߄���4B��(�B�u0������r?�j�-` �lz�
J�X��w����	�����_�,�@�P�;�����_�t�k��5����ԅv����œ��A����l4�.j&�檌J�(�Jn6NG� ��,RUXv�4Г�JlsXGw����w�薳y�k&�Gz}o�� �����?�W���`�og�FQ�����=i��j��qE�����
	�?�/E�ށ�00��b)|�1Nl�6���fQj�x�$�?7�£��咴렃��u��"�@^i�O��o5o�C�7�d�'�T��A����zϙ<ױ���_:ma;��p�����5�?� =�kp��W�_��/��wI�:a]�]~ю�A\X	g&Q���R;���v�"��ӳ:�]�G)�_d�+SZ�o�����)!��@��[W۳Ǵ�����<��(��y�o@o��z[DI>[��u�6&  ��i��@գ&�K�쭰j��gɭ��Va��	X��8˲���U��I��v\Ni������2L�Vu*~�/�tg˵��u9IT��_�$��T"/͙79quo2�k}4x�{�q���i���-��38��:�����4IƋ[��tx������-Ƀ����~��6CG�'��u�̋)Ԉ����ג4�&H?fYT�~�����S,|���� ���=>R[���IfbTq뚵6PY�O eey���8Y|NJ���9��?$.b�x�p�Q�QL'g>|�Uy��$��z����,�Y!���Pk��m�������z��:���s}4�b��l�¤����!+��_�<
~���vw��*������>���B|�b� s9,�x�&� ���B�+��W-���-��F�[5)����80�����z�	M��d��lϼ�y�X�6[���E\_?gͪ4�5y|�_O����Q/�B6�茼���&л �@	�X�<�}�dҘ.���y��R�f;rٖ��E|A���Q�(�K��J������(F�牁�8_߶��f�,\�;�@T=H%2�m��Pz�d�?���/Z��� FGT�����Z)���u�V�Yx{>�G��~f�0��ۚ�hnc9/׷�
E�Z�(bw�G�Yz�#�d��vF��,���9Vx�SJ�8�DO��T�k�WJ��f���ͩ�@����[Li�Ɍs��Y�o�"�(���:�(�AI�g�E��N�b��E-���@�� ����GL�X3����`ʊ�?�9�X���Y�-6MJ�"����E�� y�v��	� �J�t��߽��a�.� g���z��̋Ո��]�������y��>XU������m�Y��6A��XZ�axӴ�f�iy%>M+��W"-��'�0| *���YG��*�l��t���FjE��A�����<�`k��Z+�jsƗ	k��i?#�e��z�(x�R�S�&�ik/(���\��|u9%�|�&�.$�\��xi���u7C8/�����-%�>�c)5���;�%6�S���!~��j����miQ���]��4��k��X=�����;NOz=��B� ����{5�8�u�ϸ�J��|����ə<ؤ$T/b��z�f���ٌ�X�]����KVk�.$8m"V�+���U�Xd�?2��oI��2g����+(�y�$��`�IKZWa3'P��\�[����59,6��db�R7Q��_��:���Lp�f��s^ƑǄ�)���E�M���B�{�͐ƭ�P�vk�\ߙ,�;Yq�m�=����jj;\�2��g�q�VӺ[.��"s[��(O#�.JҠe��~�e�5�>VaG�Vt/o�<"J%��حJ�?�ι>��Q�F�]l�����`�^���ߧ6?�2_`jIϒ�g`{�i㻱܊#Vz&[�:�L*>���}�����dTCL�COL�?`$TӖ�[�|���	�Z]M�l�½�n�+�b
Z�AU�_��*['h�z��x�wh�)�^�u�%�uX�W��2�����)5 ��V�St�?���Ȫ�XMlp�83�y���I�s��,�����w{rpEI��HC/Ϭ7 Z��&cUG�%sf�����D.����"�0i���Q�Ѫa���J҄��B���F��A�Y�F���d��T�8���)EzP�zn)�vҭ�yk�W��T�F�&���Qg�:ma�Z�V-��ҤfD4O�Q&�O;6<T'I�(���AZ��R�#cc��J��Z�[,Yβ,l��J����uII�Ç��y�ȧ2�b���S��1�V�B½^�t�	S-m�2Y�A���	en��KZseO<X�l��A#Qt�}�\��2�6���/���о�橐�p��-*˪[�",����)�i�a�Ǆi�է������1��tt[���w4���vɵq/�ɠ�7#ZU��N��,�Ori�� ���5y�����@6bkE���������|���I[-2>̪���l_���?
e��f��r���k?�S�IuE�UW�:V9r����T���g���6��+�.��D�D�1�Uψp���B���H�`������]P�"�/O�m�H}�z���Y����U�X]�^���}�[^KY�S����d0MoX(�"v �����撬�]��u    u>C綌�ĻWQ�x&��W��iPUОı��*ws����B�EU�a�Nߺ�g��j"�6��k���r�����2�"/_��;���x�'��d�@߉p4���""��s��l�;2C��P%P�ֲ��kXg��y�	͋����	}I�[m�m�v�_<Je��AE{Rh�����0�Ƨ��:Z�1�3A�?��V+D�PǦ������1/��%W�&��=��? مw1ia(�Ȼ�*rT�j�|��_B����S�*�ez�oͿ��T}�SI�NX��)�D9Rڲ'�ϩ�pl�L&�X�ד�X,�ɣ*�A�(3sb�5�$��Ie�"�.d\y@���#��~{��Rm����Ĉ�6R[���'a�=b��W\�2��i�J&;�Ƥ�R���QZ�6KҢO��Wi^�(�������3��ёf��t	�le�J�KcW:�g@��x�׻Z��`�2�Q��E>	`1�x>��V+ �xZ��C��a�,�I���1d��;g�����,�e�zG���$�I9k��dpl�Y�PtO�P�d��rJ�x��~�ʌfq����|��P޻hV�+t9��u��'�R�j�y�b�+��'&~b�"����L��*��f�薫Ew1�S^�]6゜L7"�7H�Tд��K��ir=�G�{�4�1cg�T�`������W-�r�[�2�?XU�jJ�~�j��ۯ��Gq������LO!���;� >��悬FKY�`�7I9�REiR����W���Op~���@l���+��Q\�	��[�+��N�ތ[�^F��$7oˬ��a`>�t�(L��l������Ԕ(�f"Fcg�6�(,�����?�8�x�~�K���4�T_���\E��<5�`�y1e.��`��!�|X�i�͠�Vd,7�ȇ8On��UI�W�Z|BE~@��T�FdnR>�v|k.�#�hv��S1�DV#_�N(�,�^�δ���4e����\���]o��wY�HB����2���5����/��J@֗n+)��F���9j��=]e�����Y�]}�Ϗ}�(0#�uQ�	|��!G4������L�+;���N��{z�C��?���l��F��i�ӑ<xw�_�PR��cV����\�'���]�=ܫ�/�8���/�g� YUF.F��5�]��s�h�w�H#[s^��e|hkW:�RoQ�VIqg,�S�[@j^�n�ZUĩk��:#�
��0OֵЎ���8�'�'3�E��A=��P-j�\�����g�q|U�q�T�V�j�m+�6�@��);���1�i�k�|��I��XU�#��4�l]��F�5r��\w'���OW��p6�Yy"4��&����P��9��cU�5B�����P����zŋ���}����V� �ׇ�����x��&Ö6�R�}���\��ºX�(�(-g��L�|,���'�b;��{��BjP֩��5�	����O�������)���o�$��๋/J�/ W�4N^`�<lޚR�b�^����c�j�P��!�������ޝ	�'>Ti�^�T���?�ϧ��/vκԩ��b��v�:Rq��]��
7qr3s�+�ԟ�,��:䀂\��&�ָc��Ო�"M��CG��U[���uƠQ��mi���m�+P�I�T����=�~+�/J��rq�vԂ0)�<90K.�qJ�?�`�;%C��cF�nͳȓ�!]��L�4NsAB�BO�U��Ӎ'=�6��$ѝ8VCeF-ޱ� [��g9���w+�6mn�)�=g�?�y�Y"�	����}F�KMDD�l���(�>if\eI�'�QTba�1�r���;��a���j[�&����Ԑ�U{{��<�q*��e�p8!G�9V�#A�6o�v�N��m�A��t�_6���J8QϚw�Wp-v:�(����fy��d�
���0.�F���"�Ȭg'�`dL�6c��q鸊Q?+�L ����K�i֩����O��$��Vn�������������lb���~�kTB�qk}���f�W�bT���^��HK��Ţ�q��C��F��ȝ'J(��u#�GAo���Ϣ�Fg.��[:�i�f3�cǑ^L�����#����]��M�2"����Yˬk�zF�̓����E�Y�V� �E���95�T[��8�wP^⵮�堼e�4Ɍ�X%��2���'2����-��w;��Ha'�6'ýW�{���� [y'�vGFu=I��ޅ�\�'�Q���&������)e:��p�=f�g�&2��ꇠ2%�Jڂc��w�.�&L�a�����]k��
]8x���`c��I����&�s�� I@E�PM����F�Y���bVdeU�Ex{LMCӒ[�W�Yj�����H� �\(&���`�L������trR�
{U0��z
Ki_�M�9�ql
�*�px����m��ߜ����Y]ب�Y�~l9�A��z��*a�m�4�7�$IBWh$a�VMj5�S���&��z�o������~�#�F�"���adQ)�8�4�9?�,�j���n���Et{��a凉I�Dl�0Mzq�r�}�h[���H��
��\��*�&#fMO2Տ`d�;n�s=�bW�����j���p��=��{O����O�6���f�O�qN6���\|�x����Y-��lt��Y�Қ@V�N;���'��3Y�R/��z��y��9g�τ���H��~��l�i��P�����-�����>ʳ$�aK����: 6���f���`/�Ic$�'��Y0�_M�a1^�U2��)�2�g7� ����'�F7����.iU�⣬��8��F�y��xx��%^�'���H���8�a���-��Һ-f�Ie�>���ƫ"ng�9�
W>���@g�@���,O&��n|?��7)�yod��JG6YM�o�{1�r�{^%�i!�3ًr����c����r�]����+�0�]�Ez@ux99�������26�I/,�=^UM9 G��T�O��/�;e~f���Y�}h]��S�_�7=�`�A�Gƭ��������Ôva��T�a�kX7>��!{d�foy��Z9�X�V�Eݞa�IWnk�Q��q@
 ��,�(�e"����Rs�����c�M�=|su��G�q��Xumߞ��i��l���PL��+�D����R:�t�W�����/ؕ�x8����U�/0��-���`I�:<��r"D0���^�.S*e ^�j��{ba%��`= ~(���2�|�U=R~kfELU�&��߁�̏�t�A	��9X�ҁ�F ��69`��#��[3�wݖ����x��f�X�c "PO�-��/�4���{(-�ǫ��^��{w5e���l��@�羱�&�[�.����q��[w<~�q��fm�Y����T����l��M�g^1[��Z�>fU�M�zb�{�;��{Sq
E*�]���i���U���9L���|�������*��q:Ga��feU%�j<R�Wt,�����8���/�����~���c�]�-e'
��s��yKW�~����Lqt��x�1�b
�&��f�h�(�&M�?�~�5`�k��$pkx��|s����E��R(���U����ڡL��S��+�� 1�.�,j)��]����ƣ�:�]��*���E��ۢ�qe�Ci�o�B�,91ȓ��EN�s8W�6}���0m�J�捸�� &^ħ�W�ϵZ	�����|Q�r���3���Ix��ҐDm���[%<�O�lm�>��h�A`�Xȃ�=����樴0����Q{�.kL+���~��(#P�z���ٝ@�G��\�@��sW�����t�%]N6�N�!����<��4��.{ y��կX��<wҍ6��<Y�\R���2f:� �S��[�ywa�LC�΢��QWq�gA�'H�w�p��60[!O�9r�чD'|��x�=��A�@�0ɜUՋ1]����Ƿ��!���	c.	m��P!z��"��P����6�
    ��*�#�o�1E ��0z��"�i�6����ȶ����YT����|bƫ�zy�h��%��	�*QP�s��l~�{�g�J�
]���;���Q���6Q]��\yiUW�da���ۣA��8��:�bq��S�`J�`���o��U� ^%q:��(���&���Sk/;�pe���&A(s�h,�_$�����_M�G�RB���N�D�m�� ��ӾgĶ�+���@	f�XhZ{�z'M/�ٿ��a3�&�Ak�?T�g�xf׌c��͇��j�a�V�,��7]>���$I^��t'��m�@�5�<����(��J��Hū�9M�ۦln/��4N+�0fi���O���^����+;{Bk��X�t����kT+p��	����O�e�A�BM2�Kz��%hi�4!^�ߘ�q�$���:�1���QM��I�Bh���v�AJךr��A2��e���	��x��Ol  �������ɡ<��v��L6c)� �������ڶ��ֻ~�3UR������CyU��)��\�XRwM��8�i�̔e���1+	EͫE:��+��q�I�X]��|��Q�,��̢;n>z�Iߍ:��"��R��8[�N'�\�Vb�����|�(^��w�`�2��4�n�m��{�����$��+��1>�|��K��jY���˟���W��O�(�z�˳)�1ēۡ_�+uP0�q2�ک�M��M!CSb��?⛼r^��Pĉ)��o�Ù�?`h�?�B�U9�V��������}]��f$�*w��Q���m'c��(�y�y�l�3�mgқ$��K�"��'��:f�yZ�J�����C]�3r�<6{��~�]�B���emG��u_�K��ǎ�9IZ\1~�������g "���|�Y
l�˟|j`���/g���c����1YM�t9M���	xF�ØU��v��8�Y$���R�e�4���DMy���t5[oor�G�>�D7���ʽA\����4�PϠ�&U�D�=����z#{S�{}=9�w�^<��aH��Ay4�Q��d���zʪ���fP��m@����gV� �a^Qe =��lp�2֮��b��5Q1�X�˄%/����!�Թ�Fy�����ʁ?*��������\}����1�z�ѡn�E�aM����Q�i�y<��"��Mh�x��x�kh�l�^ʋ�#��T)s�"���;���&�gp��{3۰�ہIi�N��,�����8<49*Jzk,������3��Uc G�vݮW����ʏ�@�Zdo���������hh��o����ĥky��[\c,�K��	��D5Է&��8�3��ŵ�Uj��h?@r`~t�rp�]�<��IiY8��+��w^sSL #3���br����q�8z6��u�d\s-���*Q�g��Y	[�nM����۵I_%�S��*ͽ�X^o�6J,X�٢���)ǩ��?��Et��M�l�1}�W�{^�许���'�,��f�z�԰!���NЌE��������-Y�(�c2��ym/G�i����A-r�p����#<�`h��@�lA�hK�N�܋���@���ѻ6k�VU^ݿ-c��iv{E�Ei���E�¶$��Ga��?�Is�=����W4�b���b��y�f�ddq��R����G@?�b���xe`n$�־� ��:X1�s+`��g���!�.p>�K1C��4Xl2՚�n�6���[���YK)T�w�8�� �k
ޣ�=H+�ɻ����=�m~�7B�-�mY�F]��V}:Cs0K��CK�4�Ƕ�p���  }�R����������R�]�}��yyu'��j��r.�&����ؤ*�\r�_8� %3܌�x◔d���LSg��Q��R~�¶���᪌� �(�+]���Q�g��4���pb&&
ɘпW'.i�*�.�Ӆ�Ѹ��Y'^M�/���'�7_�o�����lA-�"a��JL�t4U����F�Ԝ�V�b�M���G���۝Zi4;�_sW�[��եE��~I�a2M)+�k��+��n0'��J��z�jb����zAց���H-��4"ܐyθ���5��0����D.4ti�O��9o�"��A�ZK4��&I��i@��w�@0��%�&��fI��z��:�]є���v���+��W��@�&�"���Y�Q�Ǜ��B�]�[���/���WI��~�M��v�
,g2��d|��$0��5=J�*Ʈ'pD�i��y����h�) �W��3dɎ�Ȝ���"���/��h�������G��E��x��6�{O����n�S�9��ix0�	EҢC�Cޫ���u���P+��J��F���Q��^��I�� 82ӡEh��=��w�*�n�R��VlMr�A����47�z3��@Q]]e��uy�&��T�I�a|UT-�N�ak�f�ʭI0/�#H�ۘ�eB�ϵ�`��豦2��,��'�wm4G1��^��A`w]���~���䐬��X���Q��	c�ը��#�a\��<���.��/s�#�:�̂������;����j����rM����L�{�����7��<�:�h�fe!LѼip�~����(c����lo�Yaj��G��d��"כu��u���\�=6iMK�qy�	�N!K����m����#�r�YLu�"c�>4�|F|˸�d�������͍��ZZ:����צ���1 #��7O2���$ Լ���ڴ������Ң]���'a<c�hN}��O�.�vT� ��`��R.��v8 #;{�����QT�_�މY8j~Y�?s�O�t��8s�LJh��!rCg�����m��:g}����P|d"���m��O�L$e����%Ǟ�\�F(݇D�jR�'E�>0ƫ�Y�O�y���+�*��J�3� �B4���6\��<%i�b�`�׺��*�n��H F�v)�\ڢ;
���N���Es̉�I�����c�6��J�?Q���dt�������(�nς�$*<��J��.u[	H����]%��#ٛ�H�qA��en�%���&���~_�ϗ�3�t���]XP ���~<R$�>Y`u_��l����Ft�ÁԖGKv!vG�wh:mv3 R�:��M��!hK~���| \�mL���Rj�#D���(�Mk�浾���r0Q�JQJ�)�������$�$Է�b��E��v�����Ja�6��I SaCɊAZ"�O3�BၟA�U3�J�Gv��m�#[��k���W�ʰ��3q�U���1�V�v.�L�*+g��Y���+�/���\���v瀯������o�bohW�s.��L��SU�Vef�K�І
� ������S�1�7E�MQ�y�SzRS`|=�	�߽����B7�/�[�Պ��K�N�0�����C����_��L�Y�nx�W���Cݹ	���uJԱ���� �$i�����ܳ".%-LH�ڏ����mk�;y���8��Z*������t�<����I�E�	/�=��/�^f���ǘ����@QѼ^�����J�w*~�-=�^���͡?�b��A�l42F���g���g[����G��*����]9���Y�Ȓ�)���tf��kIyO�����������ȭ�)i�f�qw�kZ��(u[;
�#��IJ^jgjR/�ә�A���{�k�d̰j�K�}�F�*氬���|�ېTy�]���]�Ā��́�dhc�b��Q�u<:*��#[Hb�|��k��Y-���?�D3��X�������"Z��+��,A!��6�����d�J��|��0��,�*Se&N�,����*�u���q]��yA!�3.�����P�(�2Is�,�ާ�!����F��R�5S;�_.xW�/��u{��WrO0�~V���NӬ�j��Ť��lg�1K'.�y�I���6����b�T�"�3�x?s�ƱWh�#����P���]���̿E��0�˙��;�4媇�N��    ��d�	����T������<�U7�	\�yV�Ĥ�㎞Ȃn�һ���E��䚦|y��sy���|��p䃴Vތ�LK��Ga����Ȳ�<I$���q����mO��q�6�N"�t�L5�*�ǠU��|K��Ga����*�5.���sm��K�#o��I�X+!�]7%( ��m�G�ȉY/�$�gi��:Y��'=8q_+�c�o������j~����0m�����Q��(	ު5��y���`q6�@�-�z�t��F�`􏴥<`hf�M&G&L�NjW�j|��ng���HWU�^�(5�a:�ǰ^�/NL�M�)�^S�JN��a�V-��¢�f����H|}e�_'X7�j��|9�[�S6�O��Z��0�o��{XV��M�ĸ�w?ގ�2�õ��r��<�Y4�\g���b���]�]3� �+k�|�ExA���]v�V�QXe�s�*���Ǯ�U���a*g��2fc�W��-���uV��ML��?#e��"�}h�ZM��O�˧�Sn8cM�0����t\k�{jkr3��e�W{���e��u3dU�<*�{dUyhg^[�/DZ�P�z��L=�ϟ,��9���g;@�@�U��ps�d.�j�㥺VQ�V�0�Q)"���!�50+Qr4o��^��@z���P�����GOƔ�O<E �}#�߬�jlե��Qص����0	�kk�Q`e:�[������W��
�%.n�C�m���w1�'x.�ݷ��Ӫ�+�#���7�V©���7�1�"�`���Y�o&�#'# �L��fyVc�f�y��!f\�U\��%N䊤�����gL���}�����K�#���|FRb�G"��4����1�7ճ�4��oĶt�W1��#�db����~^8���_�OH�q�|1r,�>�0�ͣ��H��p�A�҅�3�Q蘵�� �Ђ4��Y���z>^~ �ml����#���D���_��*�����~툨��[�i�PP���]�l��tmj<�9"$�'"B�;�𷞆`�=V{C5��,�+�g��9�xv��@�y?�c�T���|�V*����6��r�ź8Q4�ͭu
�<S������n"����=guU��j�b���[����}I�K:��̬�Ԕ�P��D1�gE1�3��9�G6�h[�T��ҙ�O����DD��o���h���6�Y�.1 ��0�������Eg���H7�t#�U\�VE\_p­�6�&�Z�j���'��͑�#�h�jj��ok�v9�ܔ��[֗q��۶X�"J���V��l����l|%%�oŉ�K��w`���˟@�=l�@D�BƜ�
ы:JѕS�I�'�-�>_�N�]�ts�(�RG��0֡�Ǘ�:�y��!�])��t�$��`۝�tX�M�>"k��(b[��¸�o��uv������.L{Q2�_���f5y�]�WRhs��w|/AP�Ws���t�����h��q�iP��Ae+�N�J�|��!M�51Q����K/C9��6����I��f{\�D�Zy�������5��Mbb�'�!}��;fTt�����o�.� \�ɹ�@k�x�;d���Q�"��g�[���@���=v�5�Ċ]`��z^N6]�"P�[L�tF�9;��Oڲ�������$rW��"�~	�Z�ȶ�\UQg'-0��U�۪\���T722?V2�mO�Щ��I|�1�Ε�6���� e/�43���٠��N�B.P$S�"ퟪLC���6b��Mm��z��iǬ���^�ۿ1�Vb�Y;�DF��s�B�^^H����b������]�]������J/��鑢;����qۙ+�h.w��4[�\8hZ�R�ߎ��@�5�G�&�n{����\N�J� �x�kup�Vw�HJn��3�iU��[��X'R�&<@�:�2IM���8{��?���#S���n"�e�o�%q@G��
p	ϴ�69����,ږBי��������4I��kr�d� �� c�v��I[-�U4e�͉Ez�j�z{�p���I�b���ʐ�j�+%�C�2V�y�-�ڊ����GfbU��A|� �_��MZv	�W&�A"���Q�V�= ���i߻:����hV��B^�VQ8�QNWۑ���������D�4�o�<PХ
{ڑ�mF*k���>�| ��F��Ũ/�zFE[��3���"�	�BM�y`hq��}KLo�Zq���i]��(��"M}(J�Q8|�!P��gS3����J���q`x����K��i�f��]���H7�y!�xJI�
���G�Ѡ�=�D�i�_������	s���(]^%����Rq��~[�p�6M��7%���&QZ�.y(�<�����C;����{R�BS�M� fp������p�����(L���U����v��<k⡩�*��a΍9��HY�'BK����Y����g�Tyk� ���v�,#^��Z�:�0�����*�����&����m,dCp�Q��I����j6��P�����f��s��O�R�\(��ؚh��=������	�����z�FL`�A�ds1O$:c��l6�x�d�U,���F��5y�&��j��p}p(�����v��ܿ[{d���o�DQ�Yq����E5ID��N����Wr������:�ovK�5���F�r)s�׹��|���Q`54�~���,�v:�����I^f�$�qE�@˹���m:�� !Xv��3~5��ҏ5%؋"짫�^3�S�>C_�A�V�R��(β$�q<��&�$�қKJ�Dzh��� ���"�_�p4�&1����=�qZ+^ٰ��7%S�Bڜ���.���>�QiD�D�4N�@��L�T2������@�|����w6���J�O8j����S!�0�rZ�ü�s9�\V��t)K+����ye�#����D�p~�h�c��4���3�k5ϥ<���N����U��i�o�<x�����SwHY�*͡%&���1]q���1d�*ׯJ��Cm.B�n	@��$Ҭ��Pb��ʄQ�6�,�O�{�:'���M�#�X�t�?�V�6��Mane	��cw�F��dٸZ8�|7�B�����ڲU�"�����v&����mE}3iF�zb@ۍp����	;����h�<��b�.s����-��bM�y���=�Ϡ?nbdPQ#K4���Ȫ�j����AD��y:c�E�98i|�Zf��x4Qб�ƺd1�)]  �ȡcoD�e'd�#��c���{2M �͹O���)̈����MB����K�,5�IL�Q_�$�|��>Z���������gmk�/�r���T�B��zC"�ς�Sk	7�I��3-��>�2�x�C+?��69
�!]���jka��HP�"����
��bj�bY|�Q��������p�>��s�C,���U���4�
��Ȫ�)���-��Q3J�8�oc�0)<6����,����������Q �\��v�b��$2UψLU宽�E1��w������O����ʎze�����©�5�����Uw)0W!RA/��:~�ZFg3�M�bv����kQ(�l3PlK��[�Ԃ=�a��X�(��Bz8'	�N	�]\߶�t�2 Z�o����̩?����ߌϽ�ﲍ�Ij�6�$��'�M"�5���mO��Gp��[�3���兽i2�������	�
6C��Z��9����y%"<�����#J�8n�;��&��G�H �}s�� ����I�S��� f&�#��2d;�Lb7��8��Ŭ�s�B	�l=�AVE�Hl�p�n�z�8��LE-(��`�- e�.�gq���dy�UO؝D�q�Vۓ��dH�vFܪ�ٳ4 �`+�I���@{ƶ�)���$��*+�9�Iìp,�,>�q&j	��<�mf�0��D?��Tbw�ʧ����l��Z;	�V�Z٩*�,�Sqz�ܰ�H�h�˞E"T���Ԋ�J�u�E�QM��
���YMj�~~R�Mz;&����dE����jE;�Ny0�Щ(],����[���E�O
UL�u0��zf    �i�F	�f��y��
9+�/�@O�k��=nO���w ��^�+u˯���?Ɲ�ˣ��0=��q���1��! �C�&MV���Luh�b�*x[���/Yۅ�Aԛ�P?��4�uj GJ���e�V��/��Nڮ�o�K�e�9�rs����vz�Ѱ64�fNߐ.ڒ�b���j³��>��oEU��G��W����v'R���QT�0��6���+�h19�B�y��������
ܿ,J2te~{�l޶ɠ=��_z���l�6������V���� �W�vZr-��K�r8�q�kR��h5��V̓��7r���
W��0�7��z�ɖhʄ�'� �a�a{�����U�	g�m/�R8m�N����R>�Q��팬11�^��*�"����f�����[o޼B����j�'��&�}��q�j���� �T��cadi��t�㐌
D:��:�_k��Ď���&;j/x+'��ά��8	T�6z���Q���@�7��>�,?��Γ�����V+�xѾ�r9~=R�,V�e��K|�<�.v[��*+.�X �|�l^�:��Ͻ��l٤�Y�������͒0v�<~�>�T�@���u�(P��'�y�a���'�eئ3"�C��E,&���sr��\'׏��!c��M�b��(5߭��VIʤ��y���D|�/��G�V
�o�ȸ�*i�0O"�X53b�j؎�T�����vFĪ0+��Py�L���d����T�RSI�3�;�\~W��P�K
t��v�+6�0b���N�.�q5�a6�M�(��w�ȠHq=R�w0<�"��	�����"\�9[Ȍ2J�~Hn�e�(I<?��M=oɻ�d��6o-B@���.ߘ�J'd���ɺI/4��M��f�]�y���`X62��j�u�����'���J�}���l�65�V�������)"��[-dAhX-ڇ���g�U\��O�ʕq>�~ץ�t�Q��Wq�Q��sMȁ4�1��)���VA�	�`ۧ
������E���G3����OE�or�$�����(���݉����e7^{U!�� �����bmϬ*�x�5Y��'�y�	<���C���4Q����\�S���t����\�����f�we⡒E�X��!]�NQrz� Ff=+�:�����F�5iʌ�TE��-�U؞���#�A���j���Ӳ.�xFL�Z]E�ϩ_☽2�w������F��*W#^����i�ܾy�0WI�!��YZ�{�H���#fu����J��M�<By��{�E�w��?�;2�����eC�Ϙke�Z�X�2
>`����5�����s��L%�vN㉟�N3�+�.Ϳ0Ե2H�-�П����p���J�j4-���#��&66u��Q���E��y/�8�!i0L�Aޔ[�II��$�g����D�%�/�L��G��T�V��$0���"��\���N��z�UI(M��(��jm/�N/�I����陪ޞޙ4�W������'d5��b��yX���GՕ2~��E���F9��8���*zY����2�[���E ��r�����9a,�ܵJS�m)N<��
i�]O����0K�R�v�c���(W�,G���.)n��dIn
�4x�^�S��g]Ѯ�q��N���q�G�+l$�E*�4m�,=�.�We���G�I�3^�4�BG,��(˷7y����)!��nFK�R���W讹��(N����v������0'D�27����C���j��r1�A����������d�y@�M����`'�<�M�) �yw�+���4!�+��{f��-��4~�� w�i���e^9?+s�Z>*0�o.2���l�d�٣9������-(nk��^v\���v�b�+���*�ʁ���wh�XP�_����K����E��2꫓�� ���ܞ�M�c��yRv3.Ѭ�b;e|�w/v��ܶ_	�:���J��]&��K\���x"*U
��NF�ۣW���`l��@�5��ȢۇY��O����Q�� � �P2	��S�˃����F����t�i�Ѣ7;6���ڭg'�T+'����gı�`��*��{N�=-%�V2�)�,&œ7]�ގ�˪��0�Z3��PuxIʥ�o�L�L!R�z.�I���C�̠��|��IU|���z5� rO�TL�A��B�<�������*\�a�T��n�87���3�8�Y
��ȶ�y<P�F	�P�Ns�/��R4��� m���uu���'Q�p��q"U\�sϝ;��'��W�V�}K@�V��v�wW��{�&9�q��	�\����őq�e�]��p�'�?�Y�z��+Lo/���N�&��zR����˷�;�4c�̳\�qj_e��R䙞��?q,��(�wza�T�jn��eEW3��y���'"�c���WA~I`_�+I2d�b�<��uR�0f�U�=�E���=�"􃒪ި�*�[ZA�a����j�h��mn�'kl��sI.�)/�����ӷM����ء4_�f`כ�-�O�z|{�P�aY��U?��F�s�`�z<�4��D���4O��Ɠ�� oh-��O�w.�j ��Y�m\������?���tNDM	l����K����2H����C��y���L/r�����(�^&S��g>ﷻ=�l��(�O�mϰ���a�2����NJ��g8m��P�"�B�I�7�p�l��
�6OT��A\���׋%{eY3E�s
��$a�$g���v�X�&Ħs�3�N:m�A|J8|/2�c�V-����rF�2I\��Q��� ��6���
*�N$L�W�"�*붜11/��|��M�A��ʤ}R'1������D��=\����j��4B��F��9of�N:	��ػS�����G�@WM5���5���=�Y�{)�!�H@'�}��:�'	Ĉ_��������;3i,�������0Z&c=��1/����=�Z;�_� UH6ӆ�dC�� �����
n E�5��<xZ�<>��b�Գ+"cEq�\����E������:�QC������� ��[���~`Z��=_Ğk��	Sr~O;��LWK��O(��in�	J`�K����':R�������{�&a�j�j����e�d���I��9	� �V�䊆�1�k}�NjSa F�C?��2��`�Y���bG��j ROn0���/����yIT�.�e�FJ_��ȅ4^Ԝ�zS�#K�[`�L/���0f�)8,'�
���eR%�O��@\��B<��'�n�H��3[�[�*O�T�ķ.�����h�Y�gky������i9Ց$
��.��"����D˒>*���������6�U%�Uo��f(ٗY���-�LbM��+�Y�
"��y#+���G�G����'���JC��� ����_��X( ���H(@��ײp��y�Xo���Aڍ�eR��T����¥�����!9�G��M�U�q��<M����2�0�?R������	`j4�� ї����&�������Z��X�E�ŧnb�>�Y��bY#�B�t)�D/3�'��<��{�+srg4��<J��� ���?2Dxw�v���7`'QLW|�?�kre�ɳp�8�*k���!gY�_ɵ""�T�:&Lע,��e�0J:ب����!���{�U_���3�*���$JA=2����0HG�.StĞ`3����yU�i�"��m�fM�k�.�:-����W��'Q�6�d�րG8�{^�T���G�.O�R����'�nO�*~�|��N�#�˔�ئ��WgE:�Qq���0Ĩ�PJ�p�
9�o>�V.H��\��v^���2�ɫ����_�a\��W�Sm+��J��&j��������李�U�{�q1�Һ��9���S?&���Z�*-��V�ދڜ`vs\�G�d"j91k�ڑLҢ](S�Mq���)����^���a{�0y�,�p�7H�	!VO�L)�Ed�������;�]=d����I�0��k��O��i���ƿ_L���4��$    ��PIl�5R�)�nBѠ������u�����r�tܞ�¥�m�3��w�����0��������S�
j4Ȁ�??l~�v�#���[.g
|A���W���%m2'u=^�|��1?�@�]l��3�'ۂj^|؄��y�޷��VX����~�C$��wC�,s����d�S'�b�2(D��ͣ(�˗��E|�(s�뇳3H��8�����T�/;�\�����]���,fl�4�s��Pãˆ�h23��(�n��XJ���!߄}Y�3�RL��q��I�*�9Q\sx�NA}�����0�G0�4�U;���id�v�4*�p&���L�DCrs�a♥y��4������q+}��� v^e��oY^��V�5�i
��b}�T����o�^��^��!�����[MjsG�G`М3�o' ,��./�d�ݿ�u�R���?�?q�|w���g���)���qVU����q�hBH	fQ�iZ$,(6Ч������ku����껛�l�C�Ϣ��	.X�呌AX�Μ�c�����U���{a��7�F����y-��\��h"����D*�=�Q;�$.��`9N�JWO1�h���!��XX��3{��m{K��ݠ�y-4m���ߠ�]ux��
&P�}?1R��)v� vN��)|��A1O�/똻M|9�S :i�H;o+xk`�ah� @�_��6�bc�	�^/ʼ�������+z�GԵ$g(�J+N���\�#k\ �,#�d�
O�Vx|�uL7jq1���/��l����F=?3q��d͌z�<S�
���an�� ��,�ޞ�Jn&̙m��S�L�0 vIn7�a�`��''g��.����d���'�az�U��SZ�?uq��/ZN^�S���}��M�h�������2����"ש�������6�|ƞ�*?]Nb�*���j�K�
&�gV���ݓ2l�Z�>�A��Z�- ��dS���
��Y���װ�vq��Ü��N[!Iy������2y�21���N �����ܒ��������e���ݦa�H/���f$I�O
����� �{K�;����)8���$�vF/�fz�]>'z�3	H�,�ռ����� @P
V͋��
���u:��j�ߗ�����=Q����ly�V)�&��]O��;J{����I:��"��Q;�@k��%/7'Н� �aD���U/bj��g�2�����v�� ��x�(����}
x�4�K�7�k�8�&�d>�^ņ짺jS����E����جU�{�HRoD�D���G��uS�g8QP�������[��b��̵�lT[�Qv���iQ�w�
�jGW��1��u��>(�Ȑ���,R�j�']��َ�
�=l�W}l�f�ߴh��n/�cp�ܹO��3�cLb��&�}�V��>o������6܌[N����m����8���=9i���uo6%57Pˊ���8� ��O=#x�t�~`�W�-���vY���YI�05�����{R��X�S�`���e��#υ�S�G��o2��CW��`��wT�4��0RΞ،R�'�	�I�8~������';�7B�@{Bз���H�z��:Dl>)^V�(�I�k�RV�q8�U����	���htx��UW���.�>�[u�sG>�i�ڶ��o��Su�y�j�;	�Cf{��m��iw';�?�b�����e��i� ]���(�����A��9�aN�en����@�J�N���q����3�@��J��rǫm��n�.��bƍ����!�p>ӵ����~LE:i�{�0��ä��A��ǜ���X��EU�HzrS
��e��1+�z��#�e_��b�~�jJ+�uj�؄z�嘗U�/�<�ot1�7��2�-�ˆ����	���[ҷ�cG����oy��H>�:�1�,í틐��x�$��kqF���s8a�n�0V�<�#T�y!���d�)rH����\�{��ره�> /D�Q��<����/�*(������LJT��"0����L���Ή[B]T�k�e�G�R����f��F�_�T&U\θ͊��#��>���ʜ*��>�������qOME�M�k�,vӪNgĥ�\m���?Mu��hN7�������[����rK&�LݖM������G�AZ���Dl]w��GJ�vل�#U �djZ/��[
�r9�S&n�˥̜�p��5���Y�zN�@�)Xr�Bu�G���R�P��8}6��uH��ƈi:���{ÿBsw�^�8�����S&t.�b�~M�ӫq T�':�s�D	�p@'��[E������`dKU�]V�}:c3�瓦U�8���,Ws�2���^Gx���vx?N�N'��R�a�>�7#X޿�p��u:#�U�{Dp↾�v�2oI>K��j�>˱������ӕ$���U�YP��y�LT&�x��Q�P��pdrO���ĩ�0jU�������j�,����"�\ޗ�������݀P�]\x̵�]�5��7��-���&�����(I���<�Tv�Y����DI�������Io��Q��g�wp�NV��څM3d>*\��n��H]m2�ۡ^�sL�\S
bx�Mvd��W��z9{�>�wV7������l3r��k�qIB������k�)�E5]U'��W���tk�L���c�!�H������O z��A��Ԁ��Q�_Yp��f9�"��I�r��._D��Y�K� ��_0�sy!�X���tCM��ʊ���"�s�_OL���\P]6߶�$I��Y�vFhi�J���Xm���2Ԯ��j�u�����,�;ɬ��y���w]��-�P�"��c���[�tn4��G�ƬX����P>��jӂ>��e�.*gP֒�H�c����)whء? 9]L��vu��LT�`�v��S�U���?�:�ø�}T��I��Ya6���� �䈟�oq��h�B&b�Dʏ���L�̸�k�Q�2�n����j�$.��_��9y��I+Iz���Zx���۝�*k|�ΈW��?�U���	.q�s�>��
�a���7���I�'�n��jB�����O�zF���?��"\=&lv���=��7Ā8����BJƳX�zY�ٌku��N&�i3ce╿�(�(���q96�u�'i�ҭ��#�*�<ŧ�4��ƫW`#�A��̭(bB�}�Z�7�_�B��6f<�e�y9�<�pM���zG8�W&^�֜� ���ˤJ�}G���
�FGΣ�gU[?�P�=3T��~����**���:Ʌ@ƢN��3ɪ>���DZ�9kO�X�#�}B���X[��+�=4�;�S݉��b9��U`�/�=�_N�c 
� ��N�5zd0J&dD���vC�R�ē-$v���>��=]�� G����K �ܫ�jT�ź�}����JC/��'� ��������^PL
"���qR�#��E�O
򳛋�)lj���jR��&�泟*��M�
Ycs�M@_�a�׳�X%��:#`QG��΂OVS@r�3��_����u:q)a�^�����-�U��g����&A˥a+ t7�z��@V:���
E�Z0#�Z�a_���G��/8�"�$�$�Z9��Y2E�3��d"�E̿Б�סP�A[��o9d\��|W�L��rH��D��{?�D����F��)���2	�fҊo7�{OI��#d�'���h��B�E��3"Zƕ�:�d1@��_nI��L<l��D\�c�]�<aܢS�7&�>l�e"8b+:��#�B��ed����껲ooϟ�4�JE�a"~���^v��~S�������
Kfjq��Q��C7��<zTlU94
3����%C����]��+��Z$o°�oo5�yT�P��g����Q��q�����w����]-�п����<0g��X��v`@W3\��3D���	hYf�T$�A%|���^��N$l�u�p�À��zRX�#�C����b��C��G���&f>di�h
xa2#^qGs�A�ߠ����q�'�7��FC˝W���9�e���    1-�ུ<Q[�gk�F��3&�'�Щ����P �.o';е�/�A��E�86�X�N�^���o��ng>h���ٌ�PZ�2W��O��H+������������mϡ�L���u8�urE��}�'��wCV�>#be�+�����Sh��V�������`c:�=/M[Z���%N�����W�j/&q;�m��~��0�
Ge*ʀ�u��&�f$[֩���Y.��BUp�ݎ�F���(��z���3�p�7�	f��^P��T]'�/`:�����rB�����/��KeTH��T�D��aN���8J����r�t�G3X�Y�ġ{�KSlPjY̘Xe���T�Q��Lu�S��	����6K��r���)��<	=l��ٚ���!;ڿ?kC�\-��~�ЦsLyVzM���=�݆z���j+qx��W��"�:��*���2��P��\Oe�3ٕs�|2Sx�[�V�U27�$�'�� Ն��V윰mCT���6�|�:}N��A��:1S�m�v���4��On�m��.,��7Lt9օ�B�z�Fi�H��d���.{ރ�;��%� .�>�B7��֒YL����h��J�'�oE�Y���{�ʻq�h�=Q�2Lq�w:ޠ;�QvrЯb`P�
kGV�惰@0�"�A���*���e�9�A֦VÈ���<2/��h��6�|0�褝��	I�7��c>����Z��Ɩ�5�I�3.�"��<�,(e�*�Ʌ�"�O�S������^�>�ثG��l1w�8�X���RV�I�ʓҔ'�-���fDM�b'Z4�{V�}t�Z~��"�����0
!~2n�Q۔,��j�å��q�fQ=�݁K�ӫ@<&P�Y�5U'��+ɢ��n�o2;�r�v��n(�����A�!2n�V�&jx�/ ���|ܾ J�:]�'��N�|Q����>���x��=]�Ww?;��¼0�wu�(+��hA ���a�f
��8P2�b�'��Ƀzf4Ux���qX6�����Vq���U���c28VJXM� ��@���T;��C��Y��2�{[�8��"��Q1ɡ��],��I;�YA(��T�a����i�j�����㰉�H���̏9���tVU\��٤2Ϝ,��D��=��T�P�$�\��<�ʬ�	Z��w"�'0�*��M�di�p�	�#q�'9�=`����?rݱ���r�EZ��\oZ�(2���f�y{tte�B�Q�"�"ma
m�xhF�kf�|$
�a�J^�a�
ު���EĶlP�:U��+Ǿ�6������T�j9�R��8��f�c^�q�ڪ=�ۈt�5��6������Ǳ�3�J��ZQ���P�aX��=���C�
�ڔeB��#����
��JNh�Y�V���2��Ƽ�7��"����y�	�f��&��虽l�o�F�^���T,�
��o��
S��>�^���0z$��ہ�rP�8�yN�LLW��˳���ۯ�".�ʇ+>h��WX�V�HC��;C	F'�{��8��l$�H�<-\t���R��ӽ�Y��Y��'�HjAX�+�+�{w�8������X�&i��)�Y�,�� o��8��J�]q��UPȺk1�h@\�b��.�^����g�M�0f�B������蜎�	�smĨ��'��S��R���7��uQ�0kv��Q����
eX&E�j��-4@�����z��f*E� ��6�es�>��u��Y�����㺌f�<�4��+E��:=m�p�~zik�ZY��+�;��6k#>O����av.��H���lb���{�8n�r�r_�����(��@nݝ�$L�'Fɑq@���`��M9���㶞��R�~1�Pr{��п#U�ى�Yٙ�pF��גI�#T-h�y�l����[�����`��%�p�<b����Q�L�j
;>���3��qSb=�VTy�k�Z�
�
6g�yE�;/�����,��#d��S,U4[���Γ��5$�m�o��H�nGj����|9
A?p��{V�z���g����(q�a?�͕
)��o����J
C�S��f=V�}.vP��g�0T��u@�4J��.��@���*�Z.?�eLɺ=���x�Ä�-Z�P���"vB�{����I^�3<e�'�(������xN���&d��	,r�먇>�̻�(��yu&�TJ��v5�~�i���S�T�����",T����[�)�O�`1S�/��p�r�D�C��%����ݙ��{���,�8�+� r�մʚH[�'e竵���*3,���>Yų�99;�)i/�Z�T��:����ν��=�l���1[�OJK�,xl���P�Yq�의�"Uv%��t}:��'�Z�۩��U�5Xm����<	�4(^)�7���NNZm��-=QS������AxJ��V�$" c�o�Y�L$��T�:���������t1?�14h�#��`�#A��cM�MR���.F�����
P���=?˲~�s���F��H]��a��陛q5M�咞���p�fL�t�$�4ߢ�s��� �06?�ۇ�Hcԫ�(/�M�/�{a�8i�v���*}�4*����V&f���@Z�t�����DK��*��z�K�����*/�#}����Vo�g��'.D�uS���ӗѾFPѤ%���7A_--\l���z0U�U�?��~&�L��h9����К[����*�0P�yaO��T���ل��p��$\:���G�i8T3�9U�NM9���O(�1�i��ݞ�;5�w�UR܋�hț�'x�Wi�!	�ʕW1�(�=�K	4�ig3�A���"����+[ �i�Ӣ��b�؏�����'Tj�EϔaZ�z]� f{<T�nC�<u��4N�߽��J�8���~@�	�֖/4/�͆�eC屄z(�zS��x�4��1��`o���IjN��+	�}pNB�?���G���D�)��6<u�(NgZ�E�t�or��i��&i{|��!����(�g-�:���A����vl�@2"���6k@�Z�hw�6�uW�,�ob�噣�q 0���Mjѫ���y#s�=^�@je�B}P�(ԟm?�E���T�A%U��,�j�b�W��Y;���I�zӸ#٪w�����`�/w�:�ٔ���~�'~���֌�߽���bEBQ�+�ԋ��;��_�	�D ��[���v���!@��ɡqO��/����؂]�_�j���:Q/��J�.��������!�-J������x4�%ye�	���H�9���^��	~��,��aE�1�<���.��H��.��wd����ƥ7�Ц���,�������L2+E�=|w�6�����櫵�v3�z�[SEq�W�j���N�#�"�`A��2g�2$��m��h( ���"�lej�bT���^��ɢ�mfܒU9�N�� .��oh�MU��@M���69����7��)+ʢQ4�鍺��:�l50�b��,����(Faz4B�\0���13okN�fo!���!�$3*��+q�Iy����L��0r��4
�V��_:��O%��B�gt���We��D�[�L��J���cY2�i<#vy��T�$	>B��<�p*�r�?�q%[��ˣ�������IfAV�y�������ы�dr٥�#��=�N���r����<��ӂ�u���f��պ`�	�2�Z�f��h�i壕��p&��Y����|}׃Ӵy�/'s�����U��6?C��	�L������Gm2��iQ/6���n�����G8��ς��s�d��X���o��"p�n {6O�L��(pC:�%�3=-F�x#C���ۂ�E���ݒE�ka%e�>~�Sc�9Z�h<�@Sin��a�{d�Et���+b?�̞��9�\w5̈́�,�⬮�|Fp�0��>���q9�?N��
�d-�r�Bm�} ]jg��a���9��CQ�"w�J���35pu���!�7��Lap7���B�4��	�ޑ���? ��֏M/�z�jx6l    ��9��9���I����W�,�T̗�ޚ�rHb�_���bo*��=���1G�&"(�5'Ðl�~g�y�7U���������V���;m��aN�jޥT��M�[T��3�I�0���;[���`w~�v�F��9]����M�<\�`W�)/��˺>�n�Fe�#�kO�	~4V<A�8���;H�l�����8��t��q_�ѲXS?��ff�	@�~���gA�1F�\ⴄ��v6��q�ϐ9���pozt�VB�b0�3�]����E����G�I����K�A(z�wG2��6��E�D���2���#����\��z.���s��V��c ݛ��
����4O7 �Lc@��eV���O��4)O�v��X���Ķ4�aEj��̗Q�]�u���6�u�>K�E�����|�ju�.��y+AN�ga��3�\����&_T� �b����č��^�(B�&����(iv��<��b�nL2S�@�����(�@����H��#�������qs��b-ۍ�K�e|�$ �ڔ�MHԫ&�dY�\��o����� ��I�p���M~���ޔgG��X\6��6_��$�̳��rS;��H����fw�����`K����^��3�M��Ŗz�G����
2��j=��b�����h�L�ܳ��i}ֶ\Sý�_#�3e$BL[��)ÎT��)��Vq�޿�E^&q4��L�$�yH���~ٞ�4�%b�Yp9[�<��9ۑ��Ϭ�8p��pM6Kr��ɼ2��uW��gNfa ��+�Rj^�� �m��%f�
MC���V�Z�j�_^��0#Zy��E���\�S�=��Z��pX��	����=	�0�UF�d�w��߿bH�t]1�I�;8U�U�`�Rh��c�y�/q_�_������}�ݲ�R���:,�R�;S��H7ʤt�{i�X����}2�D?ĢSp�)�f�@X�x:m1S;��[M��7��(X+��]��I1y!�)q���xԱ�M"�bK�\���9o�(=l�yf>�>#�Ԁ�	��5��K��θ�L_�e���j*d���Լ��ʡ�������(N)qL��B�z$GHl�_��\>Ib.��jZ�ي����ٌ�ZeNw,�Rs������*�*���b�Թ����l���r�"̪��3��q�.8�-o���4ܾzu\�S��c��.26//�K�ަNgt���]B���[��7Io5cl�DQ�q�Y�C���=M/~T��&��fxws@a�)us�ˊ�'�@l:�S���X�5���_g�j»Z�/�b�g�H�8�='K�(K�}Uo8��m?\�<�]}�m����
�����,��)N[@[ˉ�o��p?���|*ۘx�ί�yy���!�,��D�׎�rt��yO�TN�3?�n ~@ �~g��(��8ԍ=�*�Nx�OgH5m>_���V�P?��A\X���v\a��o�:��l#�	��@@��	2p�p^QO�h��R|s�g���ߍ�'I���LuÃ�m~_n�����"����z��Q�sehYBj@�#E DX)9��e_uQmG�U/#����rUE]��p;�8/�Ŀ�Ux��T|�w��B��hh��$� ���������A��Pr@�զ7�A�"��p�&+�ʅ.�/���؜ؤ��k`$�]��"���C���;+W����dI�ۊ����Q��@�:pY#����x�ǅh�+��%-�*��c!��|����)*�ɡ7{@�D�H�o�!Ħ�ŊȜ'C�����p����:G�R���B��n:>t�Mgd�[��D�A�"v��&zh���v��y~Wf/'o\�iR̸��9J�y��n~sz��ju��R�h�2]*��ϓ���݊���z�)�%i�M
2%n��w�5�`Zt3R��$��S�������v�8����|>A!���h�k��c�-@7��h�L*�<�k��>4���v{(IU���5|&��\.G�w�@-��T{9cφ�)�*~a�x�ĕntW�msn�e(�\B�v9�����:]��ϼH<�<OY�X���Lk���b�����c�0���[oO���!9�:��s"�[K��᜚���S�ub����5y��?y:�sxZ�W���N���-�g���O'4:����!y<^���}�D��c�?��36����a]��y����\c�2������ư�wQʃ/����o
�X<���F�P���q�;�3싥�*�硖�i�ַ�F�$��"�E�=��?A�џ��Y_��IuVt���TW���}�����<�&�!�iGC7�����8L�F��XCj�0Ѐ�}s1�p���^��lwN�m߽�V�9��W�Sj�4˲��*xs9�6�'H���T�	�rD@��O(�h� R���cG>�<����%�\��*�=U�ee���qUQRP&N���ӊ����Y%�M�����#�gQ�~V F^ݿ�T�4e2�,���B���;ٹ��k�cj��W�J���{s����uO�^�7�5�.��	a3EV��qV@��Ga�S^E[�����h�M�|8��/�	�*�¯:�$x4W����x�i����/��p|n�����D���~�$̻�3iW��])��tMU�V�'nn�'�OvTm��F���g�gi)-��n��B������iiUҷXܦ��B��࿱���3q0?i\9yq��)�8�7+M 5kF.]�]�MM�J�f�b��ϰ��P���p�v�y�3_l���Y�j�򈗻��	�-׋�U�TUVM�X�"*<׶�+���� ȸ�z�d1�?�]�O�	��KTu[N�XfeyqQ��T�e,�>�xD�!��8s[(I���K��}�1�[�
�S��������C�G*���0t7j2�Ä��>�| ?��j�뿀�d�j�o(�k�I�4�X�8:���O��ѣ@S�ah�a����ޙ����Ɲѻ�~���E��şs������&�W�S�i�	:r��nFRܧC�Q�\(Z�+!�!7@#L�[6�%ޜ��^���U5�t��"�+��b��G՗���+�U���g����2LlV�
kc���'�UmTOɪ�toa�Mr�ʑ"��(�n�ED͚0.�E����������E��a��hUF����<���5e�q�[b��p!�JA��"Z܅]V(�˦��b0����y�]�� �yX�^�����V��jD]Yֿ�Qg\�sٞ/	��8��ˣd�V&����r���s�,�u�0~��ne@� m��(�U�.�єj��]3KW�uSv�Z�^�L���
�6N�%�A`�O��5�In&�oi{G���KC�\�6�%��S��oCg�3IN�,x�#�Z{	bpmζ�p,�(3[���:�&<�I\�n�Z恸�X���YR�2{��1Q�j��B�l�"+���B(�v�x@(V��b�x槜g�Z'뼟��%�ts�[Y��:Z��5���Z	�)e��Ύ���ZI�)��ƪnY����W`�'�pR�M\x؈�5�Ͽ���,�#��7	"+�U\�T���f�7P�EO��܊z�h�Y+-XF�V��1�P2@D'j�уa��FW�����Ҁ�5��T�g�ψ'�N�ٵb�'~S�n�E4R#�~p�Z(bâ���,)�,���^�O��\.&0:�As��}>�ئy��L]�)܊%�����(�j8t1����@0�Z5��vW�����MG�m����<KFp������q:a�*��)z؀S?�+���Դ��
��r�HS�F� -�"l�	�'����*����+	����\^�ʖكl9'��Dl��$�	+�u���h��4~�s:�uz�2��>�;��׉����ي=�>���S?,���mV��j�a4);vI�JA���Q�V[��ƒ���B�FB`�85�FG���d�8<+����]㖾��Kz~oРh|������N����<��ٯ�H��Kp������?�a�}T}1?o�I턑    �{jv���7.��F�9��G���v.y�}&��9;��p�4'��0�a�P�����7{I�B*nώd��_�c�� Rפ�)��!�Q#6{L���_�恫<�ˑ	g��mZ��g�"�c��^��'��0\ۀw���R�.�Q�k��o`�Ww�����%e����?F�x�1��>���.Mͨ"��5ϟ ���鲷�����oņ��A^��}�Y�:����7���(w3�*($��̱7*jC�5ߜ/V֦�x���0��`+�<e��pD�aYڌvJF~�b�8�'T�E�z�}U�u��}�!I`G{���dy��0���^�������A㓺,�^�����fhU��	B/�WiР�1�H����}2�u�����
c˺���}rҁJ�4q���pH�����*�X7Mw8[��e�/d �����p��~J���*�] ���f���9�4B��b]3��aT�'�X�[+l�m�J��0��)����㠯�?����lS�u[���a.�2v��,��_9 ��7P+�����*����	?���(|p�yX�j��a�n-2$�mt����>�&L`˨��#��g4-l�,[cuYl�n�7���H�� t��^Ei�4����̇��Lf>��&,�	P�2�B���4�Z��\��_��fD/ZPW�O�e,Y,`��}��<��ZR��If�{����<\�#UB�-i�A�/	�h��f�����4I�N�3�i9�,̃_�$o[�@��feT4��H�/I��Yθz6׹&5���ۗE�('cc]�>���y$OZԏ���0)��*�,*�)�)��?륃Dy~�N����d�^r@=�pKNb���d���66yTOР-�4qd�,��7������l;�2[g�4V����ʏX�oݕ�+��x���fJIQ����gQ�~َ}���jOq�hW{a|����l���������'�|�E�Ӱ���V��Ɣv.Vwb�ѐ{,�F���uMVl�2IסFq��+��ٓ���7��nj��>/4�z�8�Y����}.�!2��Z�Mv�����T��LH�
�|��f����SI������7�ju��������mzH��"�D5ClJOjN�c!��R/l���ҽ������X�W����7~K�!E�G�:����`c	�H����S\�/-֔��|+��N���D�@��!����2��6��!F�{�*�����Z�WB-ͯ�W�A��`Fn��������t�DLp"�97���w��!���#lz]�i����5�zV�\�d��v6ɉƤ��v�]��o��, �X�el&{�tA�N`yL��RS���X� �襋Eo6wӮ���iQ��Dy����ծ;b�a=D2T�Κ��M*��kB4�@�Z�q��s�Y��IbL���Usah��N��K�*�ȟ�H뙥;+G?�s�
 #L.�ʞHaQ�_�0�4�f�Ê�&���}�BW���2�L�z�m���Xk�y���5p�
ie���%��Xe�PX�sX�v�d�6��	ܟ*ɝYuUP�9��6��{��.���t��o�6�g0���r9��\Ud����*�D��V�>58]��Ո��ԍ2P��c�̖6ڤ�'�ڪ,����m�n�W����B8d^�I�2�$z�Q],�ۢ�e$�fu9a_X�E�L��8^I�j!V^OF|	k%�LU+e#��/�L5X܅������z�~��B�K������
m��(y�g�|��>OZ8HW8aAkon�[�ը�E����)�A-��͖\ۢ�&(	TeXe�Ҧ�'�i�!��&������ХN]}�j�_�?+�AK{�f�ƶeN�oVe^Vn�g�?`Z�v���	{�i
�Ƣ�Z��v���|���R�*�\��Dr9��ل,ڪ)&(�UU���ՈM��-����6I��+�pqE����� ��:���V�!�Xo�D�~a�����m���M3bQUU錙��^���7��]b#"�,���RK������]��z����{�E�sǒ��ɔ��9HK�x9���J�u���?Z���q�sM����p��ɂ�����yhus6m�)�EWO�i@ �������#��6�|���t�ydJ�����
�s:3��l�tB�����ˀ�����m��nN��b�|p���f����$���MguG���-M&���zZU�Ԧ��YAB�֒4yn�-��ߩ��R){��.)�M�9�?������a��7	c'o�%Ѩ|�����QPe¾ �q4?�J^�DG�'-�Y.��"�;�cu�_{V8Z�m��f�m�r����g1t�W.�p���j[�ò�l64i��q6�1����YgI�7�,s��]h�u�$��I��]�ViD{wW�F��`0ci[O���&W���hM9j�,�4w<�%iwYٷnx%N�>K�ླྀ�Y���}N�t��gV7t�^��ܺ�fܡ��Y�o�X�Q�Y��3�����uM�������dt������k�4�"x�s��̦qP�?�k�^�BC���:�k�(��49<��+a�s��P4.!UY�ĝ�6��u�4߶�QQ��|�D�o /�r�̧��h6�x�Gy��$	�`���lJR�������<K�tFƴ���?]����0_Ύ}.��>��pB�8}����/k�bq��0ꓧ�[�4�x"(��*��\��㸿=IGe���V�O'�WQ�0��|�U�H��v��p툞�ş qmϒ,�g��g��F�Y�.妡pɅj�r�y�!�?��r Z�z!�Wbܖù��q�˾O'�ͪ����F���µU���ɶ���w&~��d�f�M������*V��Pa-Ք1��b�l#G�-�'lݿj��S���8p���%0�ӣ�L����ŽB�aT��Q���-֞����$�n��(.37zH�j�w�hѹ�6u^�MȀ�qڠ��I��<`qH���}�X,�ζ��"^�^�qX8�,M'�P��>����HN9w��:�]�����W'9��L��,\���f�\���m'�$4�؅4�ɭ����Vʲzy0����h'�@��6	�kJL� �t��Uп��rz������b��M�*t�N��zϏd�aA�m�~���1y%��o^"Dd(�?"�~��
�# "�Id�V0<�d�t�&3��5g1�	�M�"��`a��@8��~gEq�FAavNx�N��1��X�BW2Rg뫷�"$� �����+6t{?A	�h���;�K�����œXWm�뤝��3f)h0��b�ɗ�̔��>�6�?8��`�P�O������v2n�����;�*�T��8�>��2�GMR��B�%L��^��>�J���F���OC)Ǹ��o���|��w.�OFyO(������P��D�b����g��x��@o`�TY\�~F�Hٞ�n]��RV-���~>	c�m�BY�/���p��V��T�"�v�ݽ�/�'8f�a%P{�o<��sX}��@]��e>��ꬹ:�$4��iF�瑳wȲ0�eO@|�-����r�<$gU�?]L\Ш�b3 H�>�FVL�S{�����j+	�,ino��"�w�3ӊn�s*?�ֹ@q�B��x����炞�6`���Ŷ�|T����%�)��	�jQ��]Y��&YHf�Tφ�J¼���P�a␳Yb2������}�j�3�2��3�������w�ᛄEQt������e��X(q`V�����`#���y�ص���B���C��c����5�I²��	oTU����I�-�/� �E1E�N5��"cm��$���|E(-#��:j.NVe�޾�2�:�:FY����6�	��Z̅$@-;�&�{��$������J�$�`Ϭ>vGr�L����z"�/��gϐnZ��gb�,�\���&�މ�&c���\��$\e2%�e�˳�>��3�@L��͕�����D��,�M��^ӛ��Bm�!�H�Og��[H¦�n�Hc�O�$Qو?� �-P4tX    @�E����g�ʿ�e5�Ԅ9k�$�����T4���Ɣ]��N$���e�  s7�V���Puc
q1�l֖I���g� 3����4�ڋs�Eg9	&-PLZ��*�H�ζ�#a{b�B�;��������w:dzyh���ۘ�l8�����o�/Y/2����4�ږ�C���G������"?��.[tp��3u��C��)`��62�$�a���ʕbh�� esZ��9!7���Ӓi1�&$���q؍��9o��&������yLCn�n
��r	 �F������x�6����͑�:Ȝ_X���b���6I�7Q9�UH�_��9�t��G21�Vq\~��b�����Q�j<�����g�����4�Nbh<��^����@�[O��Ny�1�t҂	��9�=��}�v�(Hz��U~Of�_�_�'�b(��4�_D�N�:W��o�h�����gZ�`v�䶁g��i�ŵB9��k��v6@Hb����}
˩�uyXӅ퀸aJ;�vl̡�Cfr����I���0���dC��(��"G�$�Y�#���Dǥ;}6"�<"H2��a)g�_I��-&�K���_�d��4��[��ņ��Y��|kЎ�w""��6�ESW=玉�n=����u�)q��Rs�'J�u5!I��H�G_*3�S'��X@?fK�ӎ�NԐ�EGFhj�Z��gu�l�$J۪�І�a��N./�_�1Q�7��4�XW�d��Y@Q��7I+jl%�:C�#z�0����f<�Y'�.e>���!2hr�U�RlA�W-	��Ʈ�8�3~$�)UteX̓4�u�Ox�xD˫�����r;m�1
�@�7�T't�·�7��k[�i1u춛'����gL�ź*'$⪊
�a�&�c���p={��
OfqS�{��3�d��d.曕Fe��o�֧a{�~��a/��)G}Z�C� U)��-¿A���>��H��y
������-�U�����a�-�P�d�2:m�a�$�.�?�E�f��>��Z,����x'��:�&��LR�H�7�1@X��#&cY�J�x8Rql~��asqA�PTل��iQ�TZ��OЬ���R�?��C��N�`9E����o�^ar��aK˩sA̓�������&i�w�E�jw�<9�̉ȼ��* mA��}�W��r�sId'Q׬'t`ijr�?Sy�J�;V��$��6�E���l!��wD����'q�Sޥ,�|[�?:8ɽȌ��;�O��K7�hʈF���Z�K7F�yP�E�<��$��V9s1����Y�l(�GN��A;M���+�\�g�����(#6�W@}�o�t�wrN]�-�l��It�,�����o9R�f�q�'̃a;G�Ж��`~4l��E�h�#o'A��������pH�/��{�kς�!�|U�5YU��B�|���Lr�IU�l�e��Й�gE��w!I�%	f��W�#��6'�ҋX+Y�zT"�A[L�}6�$��v��DZ��3�͊*���,GŢ)ᚪ��ԝ͑�2�5���YUPZ9��-����\�S����iZT�Еa 摐2pR�Z��A^�G*�e���sz/��rd��`pq5V�i�Wΰ/+���������g�������1��چ�2d�5&�2�{�x�Bbn��{��8�H�_�aM�CU�_:`�M����;f%5�����bm�|�@\�E;,�җme<��+�01���BV�a�_��@�!�pt�:�=/�v@�(�ʍ��rN�EU���eO�d�>=�i��e�Z�8���cJۃ�>#�bsJ��Z��ق�f�% ��Am6�$��:������2~�3E�9�ß��5[=^��h]���Q��	�W���1��|�B�s���������jn13��̃_�nuv�e����6��Ȱ=��H��p|��CY��A�Pc��>�B��n�͛���o����\ȸ͛lBx�8���^��0'[�yF�����G�ȎX�3��	a�7xA���rB�أ��2�	�VB�z�EN��*ꩂ�����a�i�\V5I�q{{9��i���e� dM+*�* �I%�lF��d�f��&���{׬�F2�UTC'�nq�&3�
3M�@����m<N��E�dP�9�D�����gD���IS�OI�e慏�(�hQ��f]	e�9�q��9�sgq����fw%ֺQ���X�T��idQ��Ң$Y]�fej8�����j�,|'J�����M5�t��#����L�׈�9�i,:-w���㘓"N�ۛ�<��QT��g�/��~�(�]N��*�܃~�3��tUsv��-Ƨ�o���]TO^TD�����?���R�XW�Qxz�$?�Tp,����;cY$�"��z��&����G�� 1�ռ�{��lP�F�wEY�i����G�_~��~|�߻�=��.��'E~|���"��t�d�1�4�27�z�l����u�Z1{�*�k�e482�GS8�����Y%�9'2��>�1M�&�n��������l���9Zy-��Oª��A}TW�
n�WKVY��L_I��B4��b�bN��T����7qR߾�ʓ2�ZUn� ���:��CU��	a�g�@-�hK�f=�Aj�,��'�SS�8UU��MP2.6�-T�����u�:vD�딑Z��bb�󑘓δ�`��~�S��'�Z��`�=Mh��C`k��ʛ�H	j����EccnQU�?� �����b�'�UU�I'�L���mg��FX̩��&S���"�c�9��V-Ъ��g+�M��ۋ�HB5s!��st�|�<<j>����G�����$����`)Ch"s���Ћ �I�?�3��<<V6��?O���wH���J
E�������H����`��q��u���kВA�z9^�����g�1��!�f��^�0 ���T���s��P�0[ry?p�M\27�n��sBSlи��l�D��]B�_՝E0��U��"��Ƕ�K��N�=��ZΑ�,B �<����b�q�e��{�2���KF�v�thVF��[X"�|^���,����b��v	iR�'(��eU�0]6�?��Ξ��ЎV�	�M��R�`��9�u�\���e�l��4m�x�)����������J�Z�J.�h&2r�U�ߕ���FB:��;�S�.�&�oj0�B��Gv�(�4k�	l��;6M�����]W�#v�����δ15�2d8Z*02�u�"#�Fn��l��ȳ��������˂O��vTV2��IO�J͂AjZ��eJ�=�r�����F��rۿ�^N!�&zQ�_@_�e��R��D��C�»NV��y6XWZ��>�|ʞՑ���*a To�(����n�n�Ԩb�+&YVF��k���=/�GR�R��Tg�u�MT巗�E�D��%�s�{v8Wx�	+�-Js���y��v�y�˰)3���![L?�fT�Q;�S-����'^���Z1eL�y�_h������/���>����8�����f�2�ۯIc���_IL+f�];'�0����R�컿�6�V�Gd����s=ž���nV�_�oj�8����hZ=p>	��w�q�=��N���9ڽ*5�G� ,�֚/��Ah����
2]�l��
~���JdHP��N�(�NP���� R�`c#24c5U�˰s�~),���3�}�LPF.�$vL�<
�VӃ��1|C[�(����Yl�:A.�&��XQXE.0Q�����f��ub��\L(�����#��b�G�hU\A�qc�h1�|�_uE9�J,��"��� @�N�Z�!�zM-m������w�E�
���G�.nN`��BHǍp��h�1�|g4	�fJL�0�g4	1��0P���Ĕ�h�K&���g�
diO Й���l$�LG|���7R�ӳ��A��,ӽӰ�d�M� �*���\��ʀ�&���%��-5�������U逝^�e�mJ��'-QlYeQ�|�M%v��i�ѥ��
G�V�8.�:�}    ��/�^���}�ܜO�	qcy�u�=��?#Z(��*@�D�����D�!GxX��3�K����׃)�.\\�(1�?A�Z �Gۋ��ƪ�/�o�V�	y��f̶+�̕+�	���d�<ʂ�9D+��f=N�TB�iس4}՜�O�XU�M��%�1��r0Й,����v�P�y��<xe�=#��S��'�I/����j6�y��z��ժ�&���$�J7��M�  (d%x������yA|��|�����ʈ���[��	"�eR%���(θ}����P��i���kSi��1p@Ɉ��V��۷eZƣ@U�[	��81�>�^ 0"w*��%��5�8l"�خi�z�-�	T=���F*���A��R�}�`��a�GV��pK�����u/�o�.�:}�I$`ҙ~�x�g�!6���Z.lu�"2Y�DS��<-��E7
~geg���W5�uY������ҭ�0�>��t�ho�J�r���M�po��Ov1���d�60��4�Y�<yH�(s���&�n�b��,�-d~�[�����)e}����"���_��{L����G�ş꾳4����m��\`W����� ���@���l��c��w�	��ގ21�}?A+���i�
q���'�Z��=mj��$�^�!h
�����_e<�T��f/a���"'y�F�F�,����4�Ⱥc�-i'6SP�����*��"��x�`a�f�?$F�x<�Z�(b~X˝ʹ8�yRE氥i�b���Y�E��xb$<rΓ��ú�ʵ澟��^t�:n?�g��٥ċ9@�g蕧봽���¤�}��ch�zٸ���V���7�J
�W�ei���T,�ENɯ<���d��Ag&�t[��������fݺ����8v��<�����lBc5NPT��^IhV���!Q��9!lt������ �JWMu�|�q�l�����&�䪪|5Zo�''T��"�7�[ w 䫫> 24k�I�Ĕ?�x��&.���V���z&�/��ʧ�*���˃��Q�Q�>#S�?�7��yw{����\�I��W,�%��R���d2�FA<��؀f������-y�`g�{1) �U�s��.�ͼ/��r�V�Bpͅ7
^��&���f�E�I���KVB������ag��k�p.N��|^��Η7q���,�3�Xj�;������^�l��Y�
z(���9���깚4����e�m�O�|R����d[D$���.�I�Κh��	��iG�#�&�3&� ӽX;�9�A-����wU9Z���ɓ4x�y�Gv~�i��"n [l���q��1Sune'�d�(O����t�0L'Y��J}k�d���
�Wl�evIg�O�	b�
�:Z�?��ڿ$,�h�Z�?uBI]晟�'���^༃m���џ܎�qV�o�^�6x�CHܱ�.#���_z%@XQ������u��f�al���g)�8��	`�n���Sw����bf�P��76�T�N	EUx�WR����^��)�eU ��|}���[f؍@)�+В��Y6��^��I�Y�UE�T7�FȜZb�T�Q��Vg���Ja�g�<�[�%e�`���݈����VY���ኒ=*�?j����<�=Ě�]gO��̶��.��E}$�IL�ǧ(����CG��0���������	;c
�C�6����gH���AN�ڇ�o���@�+���Q������b��N^\����i|R�������J0(�
�3@��*�|㻢l�z��d�s���$����xS�Գy%���
ۤ�l}S��؃��@/��%i�̲�(�u��p�L��������q W���O%ܪV�Ȇ��b����O�A<����T�����$]ꖯ�y�>Eݤ70!�e�z�4>m��^s�n<�^_ZH��֓�5a�=R�U�ؤ����8c�1���:��3f���i�څ4� ߅�����f[ovn5$��{,�iE"Ke��q*㗳��vjό�b"�3��f�u�vYy�"��T W:U�0��a.>�ó��f�I���� ��=�􏆮SغxB�C\L�f��څ�vBA���p�-�/R�]Z���2,"c�#3�޷�#�ի��b�N��6��Ff��}ؔ��bԤ�U�Bʎ���^���I���k�O�e�A0�[7��~�)���Jgp�ga�A������UBZ��	�[-�9	p�[濚�����T���]FE<�"4���,
0'R
���La���#]yI�P)�okL�sʕ^�큟��S��$Γ�/�i����8���4�Ě����@��~`e�O�4�6�\�lc��T�6ix����4.�|.K�W����j���Ě�sܜN �04�bu�l�����o��1���0�W3e�w05�i�1�q/��s�����eQWUx{p�����]�`o��r�ێ3N�@��s=�a'Κ���|`�4~&���4������Sy�7Q��i�s�g
z���S흱�/�����Q�d/�>���;�.'���=Bv��6g�:���%�"�'��RgR�R�n#���s7R����W>�	:<���}4����@s&�U���Fi�"k��H���2�2�Hc�w��bK[Sm���zk>�jw�~M���U���ŀ���Ks�r��-��5�Y�&TN��>���#ڿ�u1�`�C���8�f��U�5"�fQ庲��8mV�A��~l8�@I)��Bd�wX���������;��_��!e�`>��ȱ���z�M�GY��F,+�-*�
�	��5�Ŏ�w��zK�c���s��-�A�b���ɲ��RĎ!-���I���%O2@���=Q��C��_]K�:37Je7B��0DD��[�m�O�l۪�}�i�#����Œ)��p���3�v?��yЇ�|`&���/��H�w���-���UF�S�Q���⫒��pϤ�曢�M�A8���7�ڝI�V��4ӎ��uK��
�,ǒ��~X���[�uM�;�J�8P1){zv�T<�����. ���|	�aN0zf������u�M(����ˤ<	>7u\s9�GCkuNdj ��eo=T�n0�H�����_C�2eR{�� ���g���\^���bZ��'��R��O�t�:K8�h�ڸ�gEI�͈���.������(n�ʱy��4?ς�#w���T-O�B`�W��� ��h�@f�����tB��*�qʃ�D�F%��Q�(�m��԰v�
�v2h�1�\c2����}z{%�Y���"xG�_Ma$��F��ݯ9P�*��j1|�G[$����^v������嬏g�@VE���$Mc� ��J �C�[t}P�v퓳�)7��5�)%Te�v��%���00��X/�v�<:R��$�F�>� ��Q�(#��\��6��2�e1�fi溋"~�
��/ƒ���ou_�~ƪͥU!Zd�����%q�u�Dp]�Σ2́zq!���q=��� g�[K.��o�n�E�B��\�N��͑!��rQ��?/tz1��b����d�"�M�)EJ�E��,�Ehk_�JY����˒٬�FWH}�(�a���ml�" u1%�i�X�7_L���ooG�2�R��+L;B����;�sF�6���R�!X�+2�'J���w����afbVe���y,=@SBS1�����`�?}��������OR	�.,I��_(/2,�!`gEс��w�E`���j�(�L_���4۬��˪��j��+�@ȟ2��Ni��y߬����,����b���43��'�3��=΢0]���3 O��U�.�T�n����3��AZ����E��s�Ҿ�o/8�8m��2xe��T��H �!��X���_�uX�>O�<r~�yi4.N�1�B�Qu�W��l����ax]&����Z�F���#�P/�.�Iԑ�|�a���e�����[R��p9��ðU�o1XWs�=lY6�۔*m�:�6[q3�mOm���Y���O���JK��G}`��϶���7ULx��l$^Ʀ�    V�r�H��2��Dt����5�{j��|�Dܟ�_���/�5q�L�tE�B������9�v>8Ϧd2A��"��TQ�T%'��a=6����S�|�=��aY�6o�<�e��ҳL��6\�*��h�w��ݪ6���Q�y�o*�d`׀B�Lt)���F�����7k +��&�g����_h�4��Cg~��5ۉ���bC��Z���������8oA{+��A�8�qn9{��K�6�t3N�rN"������x-�?L]�bp2���{�*���3��֧�G���u�R�V~{�t�۪	�mΡ�m��~Yb8�"�����fZ.����f�(��-&��}KYf -��U�S��k�]$��a���t����2��V��wݫ���޿QB�7ez�N&��0��3��@!��xDR�,F1�ާ�������e��?w���{����<Ni����+� 9e^S�r��W�ټ�p��1зNE���(5a���0���4�|�Q�|-o�a �w��G
�˱���E!�O�4��)<Q�[ʹ��QW�F9�O��<�ǚ�[�	�SDl�R5���P�ن�2+��'�_�x�r�o��͗4��=5�.t�²��m����h�g� �W��>LA:��dB)�'7"���^w��ߜG�p�f^�AL����Y?먮�)1.<<�,M�d.EEx""���E����l�d��0�Tɖ	�=+�!���[=�NBN��M������@�����p:�۠ޥ��������{b�mv���cP�.����a�<����u����+��h�i��$��'�/�� �M��<]:y�xv0�6�[�]�ߞxS�}�]o/B���nj[���h��Z���qX�E��^L�q�n>Ya�}g��[Zz���y�w<�氾G�*�����1��_�s�G}u{Ǜ&E��U|�������o��kR �XӢN�D�bR@~=\Q!��!���+�Pk�g�����&D2-��-��jӺ�2����#�f�LN����s�s����ӫ[}���uHz0��r�;�UUSM����[WWI �e� B+9�p4�#�z��Amq����#�4�TB����U&����B�{���^��y�:5����4���q��l;��QR�&dc�yt�7�æ\z{���1�V��T��c�X:m�룕?�
>�<�/=>����Eq�㕚1PP�:Ш|0?�ԑE�S31h4�(���y#
��f�g'��Id4~gJ_���O5*}`@ʯ@0*����RN^g�Fa� ���6��k�	���S�ѩ2��N竴�-B񒕳��P��8:�Zb��וgw�Kj~�y��.�' �
8a�<x/��5����Y��^$�}R�IC����X��u���r7�B��b�Z��ʴ��,���~ݗ�w[Y&^Ƽ*f^۪�<|�
n�N^�R����9���OVo��_�^ĩ��GӔ�'���X@�WO��H�.���y�H����j��������jׁ(��n��w��+h�X�&�"�at�&�b��iW��v���u��vB�B��(9Xo�2�4�?a�]��GV��!�)�2[Iz�!@� ?�d
�`���w�[^��"]y��[�Ϧ�DY<A+.���U�2���\$ɘ�b\a�W���h;��&Ǿ<�O�;Ig�&���(�1�X��|�O���&�<:���G�����)`�II0�s[aI!�$�C��{'T7*䘥GӊG��H�fjs��A�]�A5
,%-l\�|���G�[7q�:����\.��z���G�G���ZX�NT(��(r����7 ?6I���'�,�G��
�����O)�G��g�n4M�F�ldL�-B���Y}|��'O\�������WS,H����q�d���h��u��n��XC���->�o�����u���/b	��=P��g���\9J�>�ʬMb�X�CJ��]��F���
�ٹ�dj�+��lg����K5e7hZT��ðXqمU1KӤ}1S���Ԃh���N��x�KkEd( ;�TP�O�B��O�4��V&�(��Z�/�!����V�oJ���o�mjzT\X`�*<�N<�1�g<���Q���Ǚ��\N��}s�~P�m6��)����]V�I����Z�v�'N�ͶP7��d~i����p��9�fU^����^���=
1��'UF<�e��x��� �C"��+�-�7�O�z�?���%'܅E'����̟S�(���6V������~�Ј�"��&֟}79m@)&�����B}wZS��]i˄^_�V�ZLV�vOv����D�E���`9�ӹ�nk�d�@(�����a�<�HmiQ{�2Y�ڈ�U�X���t��Rb<�AQz�g��1���g�=D�i|{#�Ǒ��)�Լ���+/�k�yVL-O��C85���!��mwfܒ������Uڧ�'�</C��]�Y��:�r�1�{���r�|�ه�<R;P`��kQi��m+2�iA�uB�#�צ( ��v�0Ϥ_�65m}�&$��*�Ƽ�����)`gj��*YZ��q��V2��4���Z����P��x<��W��Aӵ&Ld�>������d��K ��N�[.��o�O����m4,�fcz�/�3��`^��vZ���[��;���
_�[Y9���&H��ܡ����2[]��ϳ<;<����R�u�o���"K��f榺��;���NZ�5�B3��N��(���n/$1��1���*f۱��I'��e��>m��H� �u�/�a���7Z��o�a�(�Z�&V��|0Kn>�E��Q�L\QV>pe�+U>��V���u&��\���nfN�ak�����J�8���g�µm��r �,�|j���'n č��rA�7KL��R�8��,ZɆVR�P�*��Sol;�ݞ�M%;�A������i��D۟��$_���C�0�(j�iT-���a�l m��Y>!dy�SF���z�ҘVԱ�B��\�����
��r27*��pkJ�Km����i��],s�a�?���b���栋p��4��r���6h�$��~��׬iX�(�B[��:��q�[~3�Ph��b�l��.*�	�"vZ3E�x�7S�0�.t�W�\��G�Y��D#�V!��^��j>��7��`�9�@fy�֔�t�	ֲ�Z���7�~�R�T�؊�)BҔv�{?!$��-�B�O�<	�i�"O��.ޣ�Ğ���G�1�@�:��n�p9�)3_
Y�L��ç��yN5U
D "";ʏ����*j�	9��p���y�Z�+)�l�jOt�"o?X�cK729�L ?T+�ϥ� ���(c��܇E>�Q�#,G�#�6�MeR}�9O[����\�,C�	[��u������ȑ>����u9��x/=�P-~*ہ���T\��H��`r�&tS��r����^��8ԭ@�d�&�;��v+�գo:�z��1Ǡ%�w���r[�� ���S?Q�-!������[�6�gN,�i*p�Ifbc���Z�tRS���V~�� D�Ӑ�>_C�\�N{:�)�7�D��`sW{fs� .�,�Ɇv���u��4�`1r��:pyt B�C'j��:�5��ruݙ���/[v9#����>���v�2�2�M�����ܙW��k��ɪ�s���� X>��#}d�HX��a<�Od�7Gu��f�&��g_�ܢ�b��*�܈Q�.�-.��O�Ж�&cT;de���/���<��,�,L70���n�۪'˵��"Sv�\�8��X�~�͆L���V�i��y�,��w�i@牼$�g���p�&�<�=��	rke���{H�8���
�lOYo{;քƤ)I��D&~bD�okrkMu:���������y�e�&�enI7���(�,�d�+�Co�	�n���ru��!r-\P� y1�������}Y���e����8^÷Qj�tRr�?D��,� ȃ���q
��fvN?���ۢ�6���i�Gq�*��/t��4���{A�\����:Ǹ��j�u�Λ�������1�8    (1��z�B��кH<�F z�O��m�_&2
&ҋ�����5}5a�]�q��\P�=9�e�����ODn��ŋ+��&@T��%�i_��F�.r"�H���wuUL�e�d��e��=�����7u�j�v=A���]-�^[󞙳��X�ICC�f8��s�_���_Ogl�h7[���cMc@���^w�7G���O���3W�W�Gi>�Ű�Y���,��,��&����$4��`2� [��tO`H��{"Q�\�7P�^zzjn�����C{�0i���|Q�ER�C�D�gLS4W��V'�������+���(⩑��:
τ���ӧa����,M���)삟dp�8tJMBP����j,l���d9y���!�0O�	S�*O��u�$�++�.]�_��� �e8���bJf���gY/:�ڂ�$b5�(�^�4��˚	A���_��wr�?�W_w8�l�dZ K����OS B�G-������q�[�e<!xE�8I�&��m�=d�D�3�Ō��k`�a���	/�	��F|2�:�Z�ìј����I��`px���ӹ���Z�����7�]��;�iv�b�iXg��]UV�b���k�% Tȼ��`)\�`3]�0bp�>r*
N�M	�c~�.�i���)UIU��ű>��wg*�W�/���-L��!?�pFl1x\T�U[���/�[wHx��9-�
@���2&{�^i7pB��n��Ś>w��9�+���.Ln6�63ݪ�+�Ф��"����y��԰�r�}�?;lޯ"vPµP!�'+ч�U�} �i�h��H �xε�L�>��	A��ҷi<(��A�8�ҋ)�F�v��,ΜkO�Fa�����1�A�O`���GA(q�%��)��W�k75]L�Љ	��~�$�1n�Y�υ�L����	�*�+�֥I�@~Y( �a��Hxf�x�F��(ut~�ĝ��Q��<�#���A�wV�Gy���tQ�z�「d��z��*���Q�d��z)��;���@��q7��x�Y�M�xX}�|mI���`]�V�=X/��[!ȯ{��|�9~z�/P���߬D����J��ȧ�I��,I����6���Pk�s�i��i���핸}8�K
�ݺ�:�ӣ�_{�NXmP�3
nq �a��S�Њ���#Y�Q^n4[�c��e�G9K+�O��g��Y�3�!�4�昶H��`�4^�:i���e6K�4��8�P�Y��b�;2�U6��͵:�rº3)Y"����l��8�$�=2E\xUZ�|�o��;V�Ul}�	��Y�I�x��b�n,i���o�X��,E ����Ĵ���p+��k��\��M/B�O�V?�ܿ����"*�n��~�ʨ�����2�?���H����^o/���p�OQ]�ӕO��+l��n��KF����J�k`>��j� (A�����=��SZ��fϽ�7S��Л��)W�?z�e�&A}����^9'��������o�����D#W�]Ga�8�e֯�R��k#�O~;tȓ�^ɝ)��W�l�� �� 4 c?�l���f+��Ox��q�h��YmPE�F�P�`-G�q��N,u.�`1��̪6��sl~�í��9�t���o��B�M-pS >S��~�����n�^,��Pf�<@Sޮ6?�ΰ��,pZm4^��� �wݙ�9(� �!u�r|4L��7)K�#��b�Q�J�,
, �L�����?�t"zB�)1+B�`��-��Ǭ�;<��,w�¨����Qޞ��8+3הd�:�H�t�^��0z� 0�S�)�K?@��IF/ZlD8[��â�nOߦ��F'0	>Z= ��Ql���3T�^;�,({���"F�f�ϛ��g��3p�8ΚtB��<w#�,�
B�9D��v�)��(
܉ϒ�!ϞZ��ڛ'Q%��Sܫ���������ͽ�$�	����/0�,��}���X�Yd�*��9Թ���͝D7�"싱�SQ[%:
�I�˾�T�l�4N㢚�n�2/]���u�Ru��&~������,]����7}�����ݽ	]gI]�>g��̙�Y�lew!�qژ�\��u"�g���_�yJ�1
�S_�����b���u�q�N�	��*_Sge�+��e�'��ՙY��O�p�(�{��&�Pb��`�m��*2�m��$�|��
�p�w~fء�q���Y/"��	ԣ������ǋ-��e�|�%[��5��mW8N�G�J��]�<D����&���%F�۪�� -���/*��uY�~M�0J� 57]C`�%���� �s����z�N����<bg%rg���H�u�̈́@���CA���u
m��`O�	Cc���k�30�Ɛ#ט�߬�1㹘��|�����k�	����I�~8���]]'�r��P�T��s^���0fۚW8��٢35��M0�+�_(p�Z�*���p"�N�b�����O�ǚӃ<�V�'M7�%Q��%ςw���z��YNvG|}�k#������^T�ΒB��~�k��J�m�͟�_o�V6��B
ϢB�J��I��.ȇ��3v,	o6�5�c�*��/'S��Џxĥ�b��?���Mh�P啸T���c���<	����K�:1�3�k��:Η�����Q_�9+�C����2��8��ֿQ4�rD\FPu]KC�Bjʹ\\.x7�3șk���q���r^��D�"����JSX����.�)��!إ��W��u�̓����G���B���4��Mw�˨&T�A�s���8�M�VG�/"���*�Q�G��B���9ϵ��ȳf����6�I��o'�Y���Ri�7-�43�Ίڲ\��U3�C^V&������24�����Y/^-����J���6Ὴ���=ѳ�m�Gu \^�����=�8�ܓTh�'�4�DE��3�ȓ����l���h��E"��;g��-]��C_�zb@�3��ي�[WoRj�<�Î��}�n�6ުLtk��?w�N�w�ُ]�XE4�w��ɗ3���4M��zJ}��Ƨ
>[� �99��tkr����e�Y�m(�)���~��W�	O��E'n�X��otaBw�<~�� �X', �E;L���
�;�����w��bP����:I�N�ۇ�q�g~�SD���*�!ә�@8S��#慰��:)�ye�4�Q0w�ڡ��K��A�:5��d-�L3�R�i����������7�(�����/dj�sy�w�͡�bq"�@�9KR6��&J]u��S>s�����+*ΚR�)�S��0��ԂM�-?jn�@�j:�"3Vl+-�&�0�W)���?8���CC���3��*�Y,P�ؼw6�bR6єC&��q���D��;Q���Ҽ5�x'�Z�4X԰<OԬR3�P��h1��dAҤ��	�MB�,\d��2�v�U$X�����(� vV�1�k��;}u�$�U�O_�������6&Ո�1�\r�/�c"G?y�����X��#�����RR}\�Ÿs魤t�p��,�L�">R��%ҿ؇>[5-w���G��o9��X�Դ��;P,��0_���UN����_q��cѿ�� eɏp4���S�sr�f�g�eȲ�W/L�>�'4�I�V�/������q�+�^T�tE򷌂��d�G��X��F������mZ��y����Dȅ���
�ٸ�I�O�$&u�>�T�'U�i�&ȳwѪ'�0����ڼ� �4���.��_0��9��j��lv��LQ�3Ey��iEy9c���qS�������jب�)Hp*'�2�rT0���#'˕b쪻7�1���v>\�%e�@~e�r���`����=�E�rs�F��퓄�����i꿬�����^X�����8$y��c}]w2�Fկ�3k"���L����5��K;����߭�&Ҕ�G2��h����l�|Ӈ�x��0Lz���nZ�ܝSc�D[sذS��~V��ᔡ�^}�8c<����s-���4G�G����27�    ��/D��!<��A��JӸ�ۗ�Ifn*R���B!��#�X�����`������Л|X���{�k��^Y�\��i�i����_��/��� Q%TY�����.� �邀T;�O>ĺST����;LrPEs8i�l�I���gUq���:	7����)A��?j5� ���S\1����%Q[J�'����\[4���}�s�$ϩ����VIg��:kIe�I;+���HǳU����2+�BO�.�@�9^��/�զ����{cy��cc�-�n:ߞ=͊����L����4xe:�bO���~�~|4�+��I4u9e�O���м��Ӽ�&���2KW��Y����X�*��fx5��6���¹����1R�)�Yۗ󜫢-�	W���ȟ�<xTg{�>��a	�s��|��,���������c%b��m�+(E�	�|Ù�?+��z¸,����,�/�rgs�.yH\H�����"@U��Z����t�d��	��4J���$��/�{�f�����������B������F@_p�H�Oge3��q������H�đ��*x���v-�����{��y�ޢ˖�g�m���-�g,���f�]�����4Ir��B�JB�c8��Z�B;bä�a.¬�K�����r�lSڴ/�ф'/M��oUP��󬘤��dm�R���j�g��8�y`�c��e��f換0S0�Σ��8�KrZS�b�t�B�I+m�~������L�rs{�`���;0w�s��;���C-`\d�1Vh;AB�Q���z9b�
s'A�2����u�s3���w�v����y�:�����;���½O�z�j�xe��+s`Jl�!: ����ټ�E2G�ZW����6߁J�g��d#�YS#�K�m���B#�!|�g�ԏ���b��m5]�v��E?}�b}� )�K�/c%���������<WlB����j1^ϩ���N�� �	�)��y�uf��Β2� JKM���25M	�2�5��w��N!,��(
 ���Ç}�l���",� (��T\��s�d1K���,YZ���������=U|�������;�����I+����M��J[��ƽ��0�'��2��`����9�����M�'�H�ny���ô���lJ�Y�USj�*-�ܥ���ŀGwOx��K���҄-����g�jbK%�s`�e�D7K��7c$3k�$������C�V�E��+|��� �]}��$��H̉��dQl����٦�Y���;�,
�6[Uoa� p<^*4�%ygGMC��2g��)��7~Bźz�+�aX�I�f��\�ń>9���ji��&��}Va��BI)��<0��_����uP��D�}��:�VKu3�M�ϷG0.¨t1�����ON&�0��.:[tn�*��Z�*oi�f�d9��\s׬-���y%KR�8���&��U��� �7��8Lg��@�VV.�tD;hX��a�<p?'��������+�F��U���7k㢴�ӧp�𖾥$��w����ղFBǮ��&�'��	w	�I�a|��Z`�X���բ̊=� a��(�x�t�N��A�m��������Q9\��j�6������
���q{S�
t�%�IN�
�v6��¹��7��b֕I1!���GE�a|fh�p��4_�c<�/����h��r�Z	�Ǝ���"**�	�!��cl�k�q�3ꫪ�&Ķ�b����e�T
	Əʴ<���g���7���RiP`�Z�	��J�#[l9�J!��ߎvʲ,rx�2̂7��<Zv
�ك8e�eG�ܸ}X�����K�yc�C�BL ����� �1����3F6Z7�z�_L��E*>�i�}:�;�n����a/7���7S����_�B0�b* �!���)Q��2,��Nl�<~ۭ�s��:�ۀ�f��];~���?Ȼ��
C���J!G�;��,
��*�2�&�����뺕Y��Z���~٩�QO�>y�8�������w�&���8��i'Y��iUYC��W���y�N��)0Q*Y��o��&0&��=�U�6zdǥQE�i�t�`����w���SB��XӠ|�ʜښ}��a��*B��K�c�?4��fT�H5h��n��T�v�:߸o��D]�xT3�b���rv���EVfI�_�*Pit��� -�W���j�	;prߺ��)>�Q��'�m�E�lgy^f�티 �Ea�Y�n��G��?�X\�x9���x�
w���4[g[�e�� ��i�L����Z�9� G�-,�19̹��dL���v蓾��ſ�灟�b���I�o*ko�e�(�|����@ϙ8���y�(aӑ)�gnj�@3}݋���
������/%j;�����I0�� �uWN����8O]!%'�0�%�����cw6y�#4���W�Z�I�HQ�
3ۏ�,1��\:��Eޘ����'q�RL�ֱD<>e��u_}���x,&�����Ӎ��~J<̵�L쯈Ю�ԁ��z����l�Ky��I ps3���=t�me�C�\��+�F���o�,}X}T���F���t�i�@��q���m�'��i�蠺���#�i�$������l�xJQ!�)������f	]����n�e�%��/�N��p>Zg��'����L�	��W�D�:Py������xR��w���0�0-˳0�[�(>��� \�!��&i�R�o�G����([l7=�pf�}XNX^��bT�/t��Z�-�(\��H���R���A��ɀ�?V\�I���<d�C��6cp���B�1ڊ(���79�,�i,�JJ��P#X���#[��U��̽�r��"5�+����:��<��fqO͙�������n�F�kk&�M$�v��%�3������]mA�j���%�G?��ݶ~1�2�.���U߳�*?�^�D!ͪ��#Rw�,�C�V�U1��;���2��;�!���54oh-��N��(�A��w����^����
S��֎�ԝ�����ЃΡI�Кsz���"��	뼨*'�ZƦ�&社R��.�ɱ8��Q�P������u�K���j�v�������'X�e;ZyG�'!��&����b��q�WJ��b�	�W*o��AR�|ℍ�Ǧ�җ���Q��OqM9v� ��� ��4�q��..�_Q�P�
��<����	���|�4�_��u��C����=�AP�%�e��i�-��*���&�{�[����Oe5�7"�2�0�/�<�G����u)o��*;X�A��<�?�b#��5_4�k�������*�"*�8S��p�|cki�t��hD�/�Q����"̲ҿ�I�F��ڱ8,� ����E���/8���_�#�y����Y�*�'��Q�zpN��3�F�W986�.h�����3�TWW �����ƷP�eL�� OU��C*�l���vq�L�8^A:/�*���lC�����,P�MT�����t�&'� �$�C�<�ŪHl��NyS������#D��ƣv����vB���H�i/�'�ԃHR��|$��*ںh&�+�"xo�Y��WB��ote�ms�xI-a���T��Y�q2�����*��h/yB�wT�5q���e����=�2������Q�I񳪵�oX19�t�W2�������:�еy�nGW�e?�ݩ�;-�O��Gs��in.�8���*�[�c���3�=�eԷ�	�b���!I���]�s�@ˡ-�O��xX��.��89B4�A!l�z$�F�HT�g�%p���L�jJ)X&�_�&Q�N�n��Tqڰ��rA��5%0��Y��A����?Հ}���9|4O�~���>�#`�/�܉�5(|֟�m���0��ԙ��X��KN����-��I-��G+b�FO (��Ů���g[%��\��Cvo a�\D(��~x�(�c����Wm��6���;Y4).F=h�m��rWM�b��x�K˳1U˴�'(0U��X��`d����*�ܫ�c�쁹EluZUT;���    %�~4%�5�UМ��{��5yC�f�[�I;!ՔaW�LL(]��ö�=#�d�bw�4� �eP���h��T�J���a0����+�C�^B�QX:S�2I�w�l�D̕^+Oxe	�����< �Gx<;\n�STܶ��r���.�<�����)Z���|~σ�|E9XS�s�3p>6L�w��]֭�:tĩ��@6	�4�����t��W	���@qjqoʹ/`"Bg���D�	k̡�I�`��'0��鲉���²L�4$)��DbN<��-�v�h�%,	f܊��iP(���'CM5,�d�H���{a8�cZ���/۪'�Ǵ*=�$�@��;�g$l�]�g
�+�2��j�h��$�T�7I7��́Bc#�J�o���U��>*��w�e��9����lm1�@3��Z�б�9��N�T�N�KN�G���DÈ.Ǻ�mEP�uX�"Z9�F�'���Ǚ�ל�E�`i�2P���<j�!.<�҇]9��T	V=�I��8Y�?�\��ζw����0F*��pRe��M��LW�/���+�B4����eDCRm�Z}�ǳ������۠�Y苠4�2�}��@c͓}#��S�|�I�r��|Y�^'���I$�] /��OQ<����X,0X�0V�]��Dʊ::91 }
:�#�.]��Z�{�}tz,E���(������b��
�;0��n�,�O��*�f�弿��@����k���}ݿ��$��5��_X��3���;D��\����I��x¬����H�׫{�vZ�1gǪ���_=#�wS��n�B4dCf��؟/�uT���,l���CUV�������ޡ��Y�(bB�iR���|]�-s�'����}8t���E*\�\�[r�u�O�z�q�Cp��b��I>%ƅ�?.�<�D���~ԅ��5ŏQ��d��ᶚ�>(mK�ǵ���l䂪��	�U���3�V���(]�u]9�"@��%�T����b��l�����lJ�����wX8�gD4�|6�_�����v�GJDT�y��&�OV,04��EZ?$L�OZ��yh7'�ԟ����|��7���g}>_�c ���؋yG,g��^�����4]z_X�/���'��7x�B���s�m@x����LE�޲Aϐ\�e���9�`�<pVȓ�0��W,V�&]^UI��^Vq��y��w�F�0�܂�%���R?ycP���%}74�S/RF�\n�=��j����d�¨Ddc��Q�.�ɯ��b��\vNc��8�|���CW�2���cܫ�̻	5Kc?��"Н�#�c7ah"�hu�֢-FA;��]���9�n���Ȍ٣��	JEU��6̤���(����~�"���J� �k���@Zg^)�b�3Y���M2˒����}[���]�r�ȕ}������H��w�������zP YV��Q����O�sofBm�څ�Gt�X"��\�r ��4�Ȥ�������z����I���C�:SO��z�r����7yo��#��)��X�ȣ�ϫx�=���a�])������ e�Ohʸ5�����_�E�����b0���XGQ�Xےvs<I!��9;̋Q7T�"�n����=��l��n�۪պi'�5M�,ĵ�ވy;��ދS�;�=_}���!�;`I�� ���6���	���к��~�ܡ�����8�NМwl�К�	�h����w�#C1z�����6�������ᜫ�rC�͖���r�=�T�{-`��d�z�r6�񵭈*�]~>��(� �æ�aB���.}![�����W���>bb[(!2y�?����&��wұ�G�k��R�mf��'��Y_�Wl�X�I��Xںb89(x���)�Ұ�ؠ��8��,�u5C�T�*0�2���6��E [�R�b�j��^'r���LHe!v��~��sN����� v;��_�{K&`#D�P�E��7����@��Լ���6�I@Q�ie��fڎ�9��g7���&s��� �%� 95��ئv	�v�/����X���&� ���Pl0H	~m��G]ӧ~�$<�2���q���6a3�˳2�DV<���7����<�I� �o+ �������'�s0������X&T$��FQ͢���MB��ݍ�`�_�����&�^s��r���d�$4�<�Yt���1{`�*��oh�����úց�(yRS�t~�y+.}fCS]*�����u�~+��NE��\yM�Ȧ!<���0c����[��L}a�_��Y�=��Qu�ח�d���&�E_p��
~?�m�9"K�(! �	|��?Q)F$�����b*�䓜��])Q��ƒȅ\�B�g{��N�B���O�+�~C	A�6�w���l���⥛�y�[�e�#Q�DE������(i����/�z��������������?c�/�x��q�v�:�|��]��e�$[��jbJ	#�5���C��]Y�1��D��n�i��sA�$�}��H	-���*}'�����Y��3O	�x����}M�~r���f�1N$�\OssdW��%94��.��ҋF� ")T@�A%�J\�J�ˏ��9~q(ucpPX˜gل�e�1�n�����*���}�pP��z�������/+�q�.���or�vC{�PŮ���?�/�H-F�>�����S��r��Q�ǘ����Tp���L�qY-g�2����]\N�]"��7ѷ��SԴݷѰ)�Q�N;m*q0d���d�C���F���8�c�-�X���*���<%��m8zþ���l��.U6Xu^�NO�Dt`�Ha�'��%�Ԋ���z#G��Ѫ��g�+vIS��a�iXZi��j��&(΢�`�:�z�Лi5(�����¥ZLTd>��.m�	���T#��*s���X�g+ϑ �\�`։�ԀQ����=��W0�DAUpd��%i#�tGta><���b	|$U�E������"� �g�G�2���]�����?��`�od�	�~����A+I�	_����M�+��lN�ԉ��� ��#L�T��?]���$�cr��H*��c�#i\ۋ�H� ������*��4Β8yyD�WM�dJ�ZQ]n^P;~�d����(QɁ���;O�v�+����W�bA�M���KSM	��M���r���I���Cv�F�l$��[�=����Oe��%ɫŐ�YQ�f�4�+���<�N����W�����dE!-ݛ�kR�9r��g�!���o�hu>	����K'Mm��e��3���"��9�x?�m+Ooӫ�Qj�-M��<���rB��4�=���m�DZ�YT�Fl:����t���E4��-�`(n8n��l����rB�L�]+�Fm�zݓ�'��7%\Fơ�a��J���u��a9o湴Y�&˦\��:I|7���;UB��Xň˫�g��y������f�բ��,K5�c����tm�%�OMR��� &�+�e��'��`���:�΃
�9�7PM�)Ok�;�����5�������b��M�;{o䗗�i�f�ި��=ܙ�������hD��+A�\*?
�DJ�J�Y˼?"����9L�,gB3[޽��fBl�8�Cp��-�*��z��)B�u�"u�:L·e#���Ù��z9w�ٴ�~(�	[L>���h�����L�ao���8%����qY�w~��e�i7a�uQ�UdQ�=:��	{��$[$t�A��>a�u����As�`~�K����fK��8�.O^�8�
���e��ozJѲCQ"�V�S�Mč��N0�P~�8"�j�z���a�`4�Y���eY���PW�W��AԪԙ��t�nVb�;���x �����r�+a�.���ڲ�A��~j]Gwlb"L"1�ޱ����O�.��o6�uY���/K�,@�kc/���	ʃ�i`���{�z�i�lP�u����wc��E��&��//�z'vY�����Q#��u�E��@�Z��7�W^��a�H��{!�2�[SF�� ��=q~�\ㆱ�~�    º�	=��(ʀ�2i�&%�=yJt���w�g�O$�>l��ݒ~�i�:4��t%!|��2�L��+�f¢+˼�.�Ɔ<��kI�D�pM�@r$`����i��7V[�q]O�}���&������%gO.9�U~@��b�$0 ,I�a{�l��i�(�3�5�ev�����U�\̦ ��4Et�="�j缳E	P�����P�J��غk7��㺽n���I�7��}R��\��;�(�e(��#F"�Op:��F�5��kU�b���F(���+L�����<@|��{�]4�b��l�}j���k3��2`,L}�g�_d�s ��t�ܯ���ӑ�*	�K�9A}�C]�9����c��f�k���gщ:n��9�;g-3/���lK������@Tx�Yb���M��G��~�U�c��?��;���f�<��w^���>�PM%/۫�<w?��8+��M,�ܛՏ�ۃ0 ���H��.����d�~C����'E�z""�|�u��U�X��Vy���7yt��r2'��`�y���3!r�)�Y[۬r����ւ��x���!/dZ$&LkRi��;/f�bn��A_U��<��3��Wc��KOAE����h�V�?�x��+���O����'L��D&N��T��W�q��շdtQ�Z�����dA��JA��H_/�7����6fEj<2��i�0����t_��s܍�4��yD��S;�\�u�HJ�8@�O��9'�+bt��:s����)�56K��͢iQL�H'ݨ#ur`m�k��)2<���>}��yY&Y�#�G����H��^�`�c={�o���L��vꆺ4("�J�g��p�%`�w��^ހϫ���=PD@�p�������9⮴U��Y��J���~sآTH�M��X2z�U)i���\�k�4̈́������+���q1�6�k�~A�;�E3�G{�m9G������$S��:��<��Ut+	����*jO���X�x�/8L�>(,g�)>�.^}����A�y;��V�_�b�z6�A?T��d�p��A���I�-%����[%1,��#n��N�~BX�<ǝ����d�����EY����Tui�5���*ؔ�9�$ґ�߷���s>�������".���$���N�!�>f��;��7��]�;a+l��2�A��R��$�.ߌEb�	�%I�:
z���$�����{O	p^�7���C�<����qJ��k��$��Jo��s�]a�A����X4(�"k�J��Ml�������b��m�1U5AO���
K,�^� ��d��\5��<��ENg��U~��
��_�7��{\���0���%͇vʮ�PM�4��;��ѝ'����� ��ۚ�'��c�*�_�ߎ��nV�����N�V�l�Lq���7"O�Ѓ�E�r�U�:���"�� �3�<��ƈ������ҳ�yn��[��O�s���+W��L�k0��ޓ� ������7�E��rnH�Z���U�8Ԣ3�W'@G;��d��LE,FVK8��*���]���PgI<a��&�=}���[�H�jO���9)����#E�Nd�t��_��@;�~�75[Ԏ V;ڄ��b��뗅̺�0�+�8����?�ь�S�e	���V~6f��� 	�ħ�b�9�ch���p�u�		&Q�bE��)�.{y���U
@4z�������_LHv6���e���vLQA]�$�m?�e@F���=c��cX�=�zBOv�콂�c��u�:yPE�ѱ	�-y�"p�ݼ����t�N�4,P��ȈoE���o� �&�7�w�nB{�W��}��O/"g55F��$J}�{��ź�����Gu(�s�g���d��þ�+y���|��vB��0EQ��`�Dw��$���^�W�H��y��-!Sgh+��j�q\��W��V+�m��Y͈��h�C{�������Zɜ�^�w��qr���9�C�rU��Z]�r:s	�q���V���[�EߢUeW�H%U��b���?���b
�@�>�ż�fs�+b�&���$/���H(�G%�vº��;}GZ1�u����T%�7����=\=%�����pܕiRx\�I���FR�={��\��d�I.B�>��S�0p��i�u9��dbozk�2��U&���P�Q���G���
��X�O�<���V`!/a��Υ�Q^�������z��R��yhL���R���(�Tz��|����:�	ޒ��_Pt�宔#�',����wpg�/_HH����X2Y���A��*��	�u�.�:L��dG&뼞��ٮ��n��;5��3*+*��8�� |UZ���2b�⚐��g[�8R��	�p���J����6>��X�U� 9q>'[L1�_z����
2Ĥ�A��f���ۃ�ԋs�F>�wT���Td�3�Qe�U
��h��L�P�+'��@�%��bͳ����^����eQUIXz���.�s�m�U�X�(��MI�2�j_\N��r��� �E�4���<j%�H�,F�{ߏ!�7-͠اhY�_�q�K�I�p�����[��UQ��z�U�(i(ӿι���u��<���x����ӣ�&>�Nf
�#0dŒd5�£�� ��<�����l��*�;��N�`� ʼ엜�/к�<S#�woVG�D�"'b�9�u�I�e����9�I���w��!�����I@J�T]�cK
{*>���Pp��Ö�u95��49���/���˵�L@-dI�J˶��q����7�#�;}�?[Νz.��"^I1�4q�Y�&K�;�fS�Qmuyw6�!�V�x�k�-(J�n�Z�Q�euK%�����5��b�˾!�'�,��ν��ɲ�V��I���ܗ�M%ğ�ck�-8#[9+�(K�^��H�t�/߭U\�iح�ݭ:@r��]��]��n`Q|M���"0�g�.��`A���� �L��"Il:ry�\%Y��LVD�l������&�FضV����.H��gnh�} I���{��0t��v͆.���'��+��y�CWF�z��e����٫Y�%PA.��O��yzF}��eԊ�.Թ0�Eb��:������"��r����I�eP�ݓO��5����bE�l̘"��6���LS�B�j���Mk�P76�M���9�> ��j��5[�%)��vu��yv��~D�7��̀'Z�X���^��avvr~f���T����~>T$�:K�	�������#�Ց/(�{!�����t�32��@�T�����@�݋����goIյ��qU��53y�Xl:������3S��BJYA��%,����i��M�OXme�uM�F�T�f_Ԉ�&N�����;��-&��iC�O] � �l��H�=���걼��9 ��&��q�,���g�v����I��A�_,��B� ��M2A��|�Gjy��
yT�Y��	�mI�:�v�����d�����c�v}|
[�#��oiiÁ�j�QYY�y�.TCױ���4����lL�"�M2A=�NR�iM^F�A�'��Rk4�=��#i��ȋ��iRO���x�q�"�0uwz]8�<���j�$i1k�� �E����I�&P�:z��X	��&6��D��h�@�ƹ$8e
�=W|`~e�Y�܎���me��N �qsP�%�n���ެɻ��:KMN7�s�}��͖�h���e��`����13�X�����Ymbb �5;�f��MB<녩>dS��$a7W>�~Q�E��" �f�y��,�������L۶��Vo�:�����{��G}�N�8��b>���	gK���ɂ��ab��D��!C��Wm��[�	����'����Ӗl��؎�n����q4�P��� �59�²���>��i�A���~�����b�΄xd�3ҝ�d,���`��`�kT�w�q>�������D[~�F|�9J7d(!����$���ʹ?��5<!�k#K���x�}^�Us�ܵ������J&$��D�f�^�� �~�:"Y    ����S$���u�S{f�S�VUA�Ȣo�~�j��QRbAǫs~�*�OY'���������2�.v��Vx�6���b^�E�՗G�������=|h��2ԯJw���@�Ɉ/��ײ�\�\�?Ej�v���@˧�E�y�^�ZZemk�f���E�z�.y+���d�#i�Xk�+¹0�Đ�WOK-�&o'����j��lJ�:r� ��j^d[h���S��g<i[� �����^7�_�nɼ�9r��K[�O����+:�g�J�-���sŅ��=�h<�ds#�vQ.f���E?�e���|�c�*�B�]Go��I�"�k;������nZýivOCX��Ά����Lg�I9�]:3��b���u��f�����!�&�ޥ�j,����ȋ���5�Ȕm����s*��� :���Iq��r�N��XdI�O��5i\D}C0�����p�f�Tv������ގ*�)=�E��w�cl,��}�B�N�#���I�	�Ey�ÛDo���ʯ�l{�!�������EZ����l�#�������,��v�euX�)��=E�!�f�T9GT�w��:af�
�\N�c�����,'�ʤ��d���%߽�tR +*�
)w��T�����������Y��2�5yQ�	Qid�@�W�Y`�h��s(����~�O��j�>9��5�P�����Yљ	]~���\YDw� @��G�/��觸��%�z��)����ղ�)�tBЪlt�ۊD�\G{��vgj77��?a����]� ��{�+�p1T�l�rEVuf��]&���'''����߃���ҁ�W�:��!�0�g����?5��"BG5PHd|�������w�=HAԗ9z�TR�Մ�CA���3�8rq���ՠ�wt��O{�n���ރ�~�ѽǃ?�O{��*�sl�J9Ӷ�� �W�(�:m{'���?�~c�>�n��ݻh�nu:�p O,���l>,ߜ��JL-��e�la"���p�z�k?c8Ϡ\��i��n���\���~���_�qB-�g�V����^�����eV��e��o`�'���l�*�U.V&���Ybkڮ���^�>�&�A�U�K:��T����շ���-��X�7cԚ������YG�)�y�(R6T�����'�T<��8�lb��񚷘=��U.f-5c��֬'�%&�WU�V��iGg���_!�v��	�({�`AXD�ӡ�v��/�X����u�L�U�V�X��{�3C�=��	
o=��b�S�]|�#%��"4:l��E�Mg��m���{Ld���z�ƂV��ar�0�=��D?^ G|�_an��K�Y�(˵�'�y<���)��r�K	�w!��&�61��V��dvl���RP�%�w�L�+���s�l�Ts0Pd���T��h�v^P�P�qI<l@�V3�7�䔸�ԎC�Y���5!璴F���v�j����]�[Pi8�~����S�NW�KY��w��H�AՑ�^��(X�Gt���xp�������}��q��n~InV?qx��F9��(��^�������>���m�@�G3��GR��+�p�Q�x��*��M@�ކg��DZ��H!��ڀ7�,���ĥ��{p]/6/������X�&+|=S�*��D�ۂo紞�W��6� �!�\���$c��",�2��P<�hQk��b5�l��̖���<Ɖ-��S8S��ԏ)���D�ܶOU>1;P�%��i����i=�MM�N/7�Nz���V�55�;��ؔ���Y |V�́��[���Js������h��DX��ydly�y�T:B�`��oG�I�\���0��k�1���n���Q�@-���IK�-�Nzl��n-*@1f��;%y���v��1�
���:�)�ΦmHv�7�u�'l��3�)p��T�?��ˤ�r�&IBxLt�ڭ��2 .��k#�H9�〕)�)��+dyG5��c�)m���V�������<-v��/P���I[F�D�*$�f�L#�0���\z��o������1�>��6�#�/�f�l�*�� v�	3E7�$Wm�AvVC��͊f�j���M�+$�7�拏-:��@1J*m�/?�b�̙WU�OH�˪�:���)�=/�/z���DA@�:�4���w�a��b��$��y]�|�]Z�w_6u�A��'|nH��ɒ{�&X���
A�]eF��c���0ራ�:��:��[���ͦ������ �{���i��)Æ�(@'��1����g�9�6N�lNץ��Y�B����
P��R�_x��B����Z+P��v1a���]U���!L�5������d�,]��0�}ٟm@Y�A�j�9�1�ҋ�aˮ����qYO[�d�}^�0 ���;vS���9���h�c�7SV��h�!��/_�Y0�5ʦ�'����.�[1��14l���C�R�A�����E����<���1q>zO��
+I�${��~A��U�����GX4�	\;�eU.v�V�I�����"�$k�Q#��lڊ�%�z��w��� {O�����G��ع=�v�%�nu��"]��I]��i֝���&�	9$����Q$*W��uI����"��bc��vE6�c�2S�n��;�3�v��'�}�����$�1�h�ޯ��GD)�c������]�� �p.�r��U����7pZNX��=>}�g����r��Fdm�|�ӄכO��ś�ڛ��J/��0�����T�i`�4��B��\u���I�B��LI��[P�`���!�'�!%_�b�Y������4�hr�,����ݩ2w�����l��A �o�{{����ǯެ����H�"����RWWI�:b����7q�*_��\}mX�hFݬ^�gXa��{,ȓ9�$W���XJ�qRg캍PZ�42�p�T�\�Dk���h��j{�q���EUsDBHz|�Ѕ&�
L�g�{��0����^2�م�+?�s?�/�Emo�g��p}e]�� >�m����Gj�%�1��zN��TT��Fv=W��ol�GT&hc�>`D*�0G��9�/�&9v��l���}���k�s��Gm�(,̰f�eH��>
��Ä���^�j�M����#լ��;e42���xW���/SO��� �͵����!�\�r��l�o�}aE7!Ȧr���>4/�8���t<
u��
�v���s8K�*A�d/:qJM�	��Ӟ�	����X��\jgO�Z7��ڣ�j�}E�jpZ4TE3���C�6;'�:����!l1h�X~��=�~8�8�V�)cS?��j�� 'p��� �6�ͧ.-\�ׯ�V��w�b2��R�b�l�(�*��^,8��TSm���ht�r�1Z��A�SB-��I./g�8K���!aZ�(��f1���rt������>`ō�׻uW����`����uZwB��y00Σ���	�/��ت@��Vk��i!cI�ʞ䚐����잙�}�.S/7/�K����N'���n,��龇ى�	q[=S.ի�"c���;�(RI^�I(w���0��^�Iε��#�!����#w�C��4vWǦZ��浃w���f?�i�B�F���:�k�M���#:	���
# /oV���*�����Ђ7�^�1�b̼�D�(�ڽG斅�J��4���c��hC��5g�=+i�66_���g�e�M�%�i�x)�Q�XX�q��_�5�4�e�~�7h�!+�/�n��C�����Tw���͔�I����?�ş�ꦎ��O@䁓z��T�ʡ����uW�})4��}(틤�ڇ��Y�v��l��ȵ���.��y�<�Vd5���-���>n�����l]V]^~�7��U�i~�C�L����뢑���N�r���~�֖Q}[\�~��&�L�ͱ��c�⫿��P�M��·�7��=p�7MZ_��E�yY����?�I���b)Y�1�������s��ص�a���5Iܗ�����/`� ���>Z��_��[WU! '   ����*�T�!������i�OZ���g�x�?���+��      �   �   xڕ�;�!�x���@�c�,�h��������${0J���5R����8��x'��~���YL�/����	����@�˶S���qT�>_:A A�w;��C���	�8�9,}�}�>ν�Z��Ӹ�%}�a���~��� �q���o:����.�?�<*���	�(K멐+���:�^��۱>h����Hˣ��T��8�?<�@      �      x�Ž[s�Ȳ�����8�'p�]U�W#a@ Kq"�$al�M��dyƳ�Yr�g5͞��v_��sf�3+/*E�"�jR#R�8Mj2"��d��FZ��_V�PJ��R'�?Hd�G��p3�����SI��%Ŀ^��%�/��^�˸�W�U�7-{�]�����fO�ֻ�Y�����PL^7�F������O+]�
�UFM��b��'8^@�rzz�r�<���xg>�-K�� _S�o�\{����-�S�-�}S���j���b�	�8����z4�G��sNn���_^���ס�;�Mć�p9�{e�;d�V��N�=2��N�ɐ��Q��\�t��?0���-ǵ��^�G�"���5��d��Z����bR����^��ͻ���	�,�cXC⇰X�-�$�Q�HD��3�2��(A8ƿu>����k�r�V����C�K��7ba�^�v��JXnY'a>:������=v���z�"Kt��p`u��>�ţ�l%�Lw�^y�OX�	l!�+iq�'-�c����M+���RHx�e#D)RI,i��i���i�����)s�w:S�0_��<\9v�t�:;=�ѵLk2]�O�n��x���7}�iZN�]�u���+.���I[�?h�#uG��U�̋���y�!�A��!���8XB)�-�CX� ��ĈG�%,�-�Ȍ�5���~+��c�s�`Ze |�ڭ�뷸���0&�ca>��v;w:m���M+_s�n���Ӱ�ùn�����؋9��}�w�NH����?�(|���'X ����;�����i���;-�)@�uZp<�T&�N4f�J�``l1ǩJ$շ��tZ�)�,���]ۡ���Sl&7[�^{3�G`Zεh�i]�]�||������Yݗ��!s������x�'~+��+i	i)���%q���uZXb`�(%a���)Ŗ�,e(F�ƴ���)�P*�\�-�����agZ:�&N9����ע���}��zt�5�ZІ���-%��eO˂xǳs���JZJ"e�oh�ڒ"�!-�Dp�~�A8�$A�I���Q"#�5e�a�c���.��>}��%���!<����͋m�n}5�[�K@.��&�����)�k���qޱp��D���ܱ�i]z��*&���w�#٬��vZ<��x@���qv��z��h)�ex����7�����"�`X[��S�R>���;��4lz����m��
l�
��ɿ^}ǖ�̊�æ����~�����e�&�D�8U"�V��mT�!��^���^c`,�!�����Oရ^B/)��l���Q��&j.��=V��W~P���cxﷻ�y8��T��[J0��4c,��o�2Kt*i�S�%`mH�$�X��ʌ�oܧ��]�ߟ�^�_r�@l��;�R�䨋������e~�瀊7j~Q�l��1:����i!�!�P=�1|��.q��9�������u�ބל��Q�{Aem��\�-���0��Y�����脲8��C�U�>ы�$���N/M�q�5�K��ň�P-b���l�G� �c�#���Gjϖ.�1�h� ��)��ҵ�:�^���X4��~���[7ޭ�;��'O����tٵ�� �:�����d��xf���cZ	є&��(�3�b��,�L��b\�X��ִ���Ӱ�Nـp:�â�1\��F��&A��[|����s��χ�Ͷ=>R-�ݚL}6�`u��4�L�����3��9��%�~+����a��4�1�T�H[ {2����'T�4�B\(�`�>���$�@8�:�5xE��z0�|b"n�:�z�������wߠ�n�i��������lVn��Mk��J�^i�(�*`�;J�9�jZ�OZ�h&��;B�b�p�(&)(�0b������r�Lq�/F��%H��S�C,!���f+��%8�k9���e|r?92qvKW��x���Sg3mח�]��ޮ]M�c!�r���DV���#TY�EZYQdI�5�����sI(�����>&}�~�
�h�e�i�V���|h�3|ڽ҄ց7��#l��N7P�ŝ���5�C���Ѿ8���5֒��u:��%��}a[򝖦�g[?�Gԩ6�rJ�XJ�U$2f&b��>[��o!2�ˮm4 �w{���27�#P���~�<b�4߂ �_w���*]/f��1~��pf��sٰ=��*5��G���Db�f����=��Raa"2�R�(B-x�)��ܘ�It�`G -�vc^$��e g�Q��>f�tF���%���|��*8X�U��P��^��s�?���!�V�UIˢ@��Vɔ����яi�Y*�Ri�R�4���$�<N��i�oT��_��xh���w�oo��ނ����J��kPմ@>�8+���m�G�WwН������������z����|��ݭ][�'-�����NM�?oTdF��;�J"���@KH"�đ�tb$"|q�Y
r�f7��ѶrЃ@�!�KP���q�o:�Z'7�#����Zc��4�yZn�	O�/�`~h��w7�`�*��[�AĻ�
O�ő$�
��wZLk��_�-l���R���-�b%�E�e)f7�����M6F���]�������5K@���x�k�V�{�7y��M7�}o{�?ׇ��-������%i�m�;D0�x5-�NK[���R���kBP���`Y�b��i�5��u�x��ag1���/ݲN!(ބ�m2[��S;pn�#�U�!56g�?Є�� �_����>�9��MþDu/��]�(Wy�7��%��%�_�[�b���+xB�2!R�cq�)��D�x�XF|O��J�lnn�uJ�����o�CoD�#�0_�0��_��?n��ΩL[�~������������P��ϥb�l3<��E-z'(xYM��Ӳ"��+��?N�(���T%�%<�Ғ	�n�	?�"=�z=��µ������#~�v�V	q�N�Ԅ�ܶ����D>1uj��Ml���/�O�=��ǝ��x�N�i%-�$���Y@c���q��L�
��ZL�8R$��K��@���2J��&�!^ʗ��9�	Aa-�oy����|���/��׵d��ţ��2k,O�g�d�Y�5[�m�M^/�́U�bwBbN��-�g
^aFYL��yJ8�J�HZ�bXG�2@�C��Jn���>%u��$nt�5��*���9448^bj��oe���/���-�`\�i�Y�nJ�����e���EU�E��M��iER�$�&��"x�?�e(�-K�X18!*M#�&����ƴ�^�얚�~����,.N�ل>P+��ol심nci���\F���~��K�s���ż���9��zY�o�񢒖�Ǉ��iADD$=�c��DX�ǔI��F\#�_8B�h}����< ��5E�T]{��r�;�,w�ݰ?����w�|����4��u�NZ��d2���/��}�4N���|��ˇZչ%� �Q��� �Ֆ�uO���'[�f��(�(��©����.�l��	x���%���8��K8�N��U�7.�٥��	g/AA&�Ak0/֨Qkىz��t�X�����A9���S<���UM���ETr���K��c�4�)�$&R8Z~?��9x���1\�(S��L�� 5�_�����#���U��?��'��v�MQ�rri��"�ESٚ&��ˉ8�e�ON?N_+����'�Hu	�ﴈ$Qt����F)D�t�iāS�iLR�!�-��J�oo����[�<�[�PR5��Z&m�h�_�ÐJA�ŀֆ�^>?�g'6��3'ھn�y�IP%-���Z�9�-�Db�#Ҕ�|�J�����`Z����C%�H@ �Av�Fm��Gh�s�c�}��K��8J�t������L���+ܹ�ڋ�X���U2��e}�����H��N�+I������f�F�`X�4��-�[�혻2쌐KL(D{�vDܷ��"2��k�z ��L�d�mEO��ˡ��pr���[��p��wq◀U�R�)!~H+�<�k���(�i�$    <a�Q�}�ENd��i���� o,]V���>C�5�0�xw�r r�ֵh����;�2��/�L�WQ��%o���G{�������v2j�G�P�Q�1����W��E����mY�%
�Eb�IF�-By�u���ޘ�[�Ph��S�WoZ�6�'����S��qW|^@�F���9c���y?^���~�x>��������p�F��a7kU�\Y�|C�Ӕ�+�G�I)��`	�*t$�:N��m����ZM�P�z�)��Qzgן2�pW����<|y�G�au�v�����Ky���)��#�ފէ�C?M+i�'�*=�GZ�7-(IĿ�K�`a

3���B�`Lc����a����b�0v4:��Y�h&o*kݲ��"��W��n�����	;-��ӟ��v��J�O���4���
��n�7�ǡ�N�C�`[�����j ����eU��y�[�p��o�)x��Ǒt
�U3��,K� 3D
�1��Δ� ��
���M�<�8���^���ƱG$H�ݢE����t-~�joq��F�%:�{^l^z;z^%���Sa����6�RWbU�,��XZ�^Aw0-REb����*�G��j�޼L���bʝ�����.C�6����!��y�uy�2��.ZG��t��ٴg������5��_f/�����}�YW���+��?�	��+����w�ń��W4��P҄��I����F��[g'7Uj��S^�����.�N�
�D�}0��N�k�l�L'S�o�p܉[�mY��t=�<=��v�������?U�RTJU}��â�F�w���*����pƌf\%��Q�@��ZE7��R�~��V��ׁ�p6�sYY8�d�P8<�[׺�:��Rv�y�����K��X?n�z��u��������� ˪���iY����������q¸H#%U�RKbJ9�趴\s1i
@�x4s�<%����M��)�*Ms��կ���4����j���9{~|I�㣲NźO�j���AӇ���JZT�E�����Sy�/8��@1�9�M�8��à)�VvZ���75O|O��vz��|��u�lT	�Z�c��ܘ���RZ��|ƚ�6^����4��w�7Z��U�Cܙ�	�����J�x�+��g��t*�D�m�����R��,����O#�Oi�btq
w3�נ�n�x��*�5�s;��c��Ay�~�Cbow��CR�&�xڭg��B
�ǚ7F�.����z^ul�;�Sy�e^���H�(��2y���:�����Z*Eh�%B�d$�nK<^�<�5rI{��}��xES��b�]?;Ep	��M�!�y��+o��Ά����.��ش��ʞ"����^%-xr\�oh�4��+��O �&Ea1��pi��	M�ĄuZ�-������G'��������۹��16`w~���j����5���LOȥn��Ӹ�%���Z�΢Qx��
Z��V�չ�g�|$05�ͯ_V
P)	��1n�*a����V����}<���П�n1�!(P��7��v���#8�N@�Z���n�8-�����Y���_���_���:~��q�\�ݗ
O���D���Fﴤe�y$�Zqh�pFb��)PB�aA-���nK+��6����@x�B���\S�f��^�<�^q�d�﹝Y�:���1���K�>��=��M�7a����{VIT��$���_?aZD�q)%2&��!8F8�	D�)���>:B��/���0zaajl��r��N��:#3���L��;��f�p��:a{��c�Н�G�y�ءw�=�
X��p%�/T�-�E,��kJ��Bތx2L�b,� *XC| ,�8���M�9�=SV�y�~p\��,.0�(�>υ�E�Z����;2HF�W�$�˸���u�T��c<����as��CE����[���E�i)�׉�u?�c�(A��,�2�&V"c8���oK���Ɯx��V���;��&�����#�m2����M��C�r����`Jf4��G�5�`��ҬW\�۫-�S%-K	��7�4�1��n[���X��,�XY	K`f�ԼqZ��D�.DW�c��ݷ�PkS@�28�	�����lM���i9�I���n�����,at��OF���=������W�Ƙ�!�W�z���8�
_!K(S�����;�H�2ŕ�b�Q� ������7b�<a��!��7�Лr��r:��}3k�j-�N���	����Gźx½��~���&��H�0:U�"��e���k$�-E�BhbE,��䂤(#�c+Q��|�~J�{�le�[�̣���m�}����c��J�������a8��yk���v�{��N�C1?����uV���NZ���Q��3�=/S�2��H��pq�8�_@�M���R�����\�Mq!<I3��7��C�)C; Nir�n�鵊��$�zͮ����ҿo,]����Ζ��C�>��H$O-YIK1b)�cZ�Y�f��3�I�bF5�i���] �XD	�8�n@�cJgăܔj�J�画2w�o�i'�3�����Ou�^j����f��l[���ʋ��㋽����6Zv�l��	���B�g��Lc�\�
E:��8E�)��@�*Л1c,Ina[[rw��*,�P�w�1M�����{
;=d����]E��0xv[�ҋ��h:h�S~�鴕9OM�خ��N���Y���2���"�{>"X��P~&8�)��L� E�P��؊�fQ$��c7�������j���(�N<$�W�x	�~	���jy��ʖ�����՞.������a"g�6��m���;D9�_ؖ�N�Y$�W(7䦁!IO2�T�(��J4Nt�حiy�ua���ɾ5Nz���G|�s~�og��F�Ԃ����h�O�����Z�����ЋFl��ˁ6���jZDR$�7�,��5څ�H�H��L1��Ms��V$$x��ƴ���)L���C�yw�e�x�<4��}`c�L�v�Wʟ�{W��}�a4�o��x���'^σ�k�~ƾ�7�9���%��w�OIv�9�\�,�hGpNY`N<�J����[��- cj�DȞ��&fO�<�^i�3�r���5wُ���K29,j����)X߳^��mz�~r��fh�t%-KI�E��;�����5����(�0Jh���Q��βH��B������y*��)ǅ�5�箉�M���Z�ˀ��A�0'���X7[|S�=g�-����ΣEcZ�v�U��O��Y�~ٖ�I]J̢�Ź�>L#�*�"ɮ�	c�Jya�eK+&�(
ݖ�f�\�ެpmӂ�*(���A�_o��N@�_���7M�~2b���Ԏ_W���)�[/5�����qr,]Q�Q%-E%��*�ii�zZiFƢ�q��)�q�K�i��1W7�u�8s7(ͽ��Es�'옻�>Q�H����v \-����}-�S��I+}�t(�^ֻ��O�~�9�OW�R��qE�<�w�*�Uק�ӈi�b��?����H�X82Kg�&4��C���$�P�
��XݰL~�9ǒS`� R��Q��x���P ����O=�T�������a�����龱jw���y�����<��A�U�&�N�;���оS��[����/fC\�~#��%��ӅIS�$���H�Qǉ)�O%��bf�ִJ���О��|\��`C{��d�Ͱ�:
�ũ�Df����4�G�9V�6O�5��䤆���X��K�J�M��ǣJf�E���`#��D��M�Ĳ4bO%����������gf�{�4�]n��=����!r<��K��*�rͯU#���p�l���j�}9��%�<����<�$r:�Z�]y�i�JzR2"Xe�����J�+t%F�H0N� �0�	5�z�h��/���1�1�B���Ì�;&��6��4){������W�ճ����}��eR]�Y���p��?<��-ݡNN�`ꎏ����,�'z����Lq}�"y�F�JAo��!an�.���U�!��--���&�d�㙭��^n@x��7�l̵s�t쫕�6&��6��nj���4�˸}\�]c    �t�6��5-����Q+��Z���BW�%��,� gR0�A�[*��E�bĳ����at��5v��
s#��rSy�:y�����Ui�?Oѯ�����H��zh��p���u�;Y������/NCU��R~���_$}ߧ��$�����Y��(�*� ��&Ob1Yb6 �`"�'Z	7p-����l�f�M9�Yg�v��5'tf�����e��/ݧGk)�6���fXl.^C�:$ePI�(!�7�����0-/63C�(�Q1&h��8aP ݂֧� }��e����M�wD@l� �������μ�Z��N�;��$[r�@;͙_�x��$���.����XWP�!�����Ĕ0c"��E�56�dX`E�N!$`3�Pt[Zf!�F�A��b`'�1�����h��;�ֵ��[��fg��q�G��4ῆ[D�������y�Zw��q5-3���oh�`8�
�Pqĉ�Pb��i��f VD��YQ��҈��MO��#�I#���3���74g|SP��sP^-��G:O��qw�dv��NWu;zj6<���a��s��㊖*�0�L�/4��v^� ��8�'.+��Y�-����f�!+F�!��l�cK��̂*Z'�i6f����O̵Xb�"�h�o]�R��z$'j[ߜ�5�����.N�P
V��Yͱ��*Z��c 3�(��V�Sx�W�%�"%��6$L��fd�Z�*��-�ӧ���x�i^�����^��*�%�Z�)����Zš��ݷ}����c�}~yʧqk���d��j/j�����׊R^��E6�}��Ăe�P"��HPQ"��4B�Ș���_��7Z�s�8k����rC���[�g��Ѓ3���]��m-����n�k�?ǳ��Ԛ�:��+�I�O�����a�M�i%-����oh)�dr�R^<� ��j����D�d&�X�h}�i��bh�/foD����23��k�ݬ��5;��n��U��~�گ���YY���p�Z�L���r��g��B>�[�k#���d���P��?�b�B�1K>�
d>Q
[&��"���.�df�n܀�Ǧd��_�ռknv6�\�)=tM�F��08�6����	[]�Y#g������N_����%�����j�7/���~XQn���Z��.�~��(Ͼ?�~¶�c���d�-��U˘cB,��mi�y;w�����8�����#�1�i˕�.N�A�_�L�ٽ{���?�f�Zx�H�6���&�����{1jUҢTJ���p���\iћV3�i+�f7�2�������6����I:��M.����%f@���߼m2�⦵����wx��6n�6���v��2����<w�Zm[���VFRͯP�5GT-�,�PL1�$�Z�~�`}Le;6�����Y��+oD��1�%�����6�M����D?���wҎ��+W�~�������^VIBsE��(���Tw�׫�D�f��"�L"��@��T���7���¤^1d֝��Y��8��L,5=���\�\�J~z��U�H���օ,.�C�E���M�������h��Q��2�|ul���#�8c�����?m�Z'1Sh%Y*9:�	U7�eRFL��������2����plT����S��WO{������ޞPm���H��׺>��Ǒ��l��������+Fg�5�I����E�IJp��L.�1OAx� ��S!oxc����Q&�Z�C;��E�)�i��?��S�rY3ݟϩX�O�#!K�>��"�k�nVs����w܉*X��Z���{���Q"�ߊ�3��L�&)DȌe��HD $�8��}7��I�>︹S�yfT�M�:�ܣ���ӗ�4�yl����𩘮���q��Z�z���qa�e4}=>��Ag�H\�1���Vߗ0�N+Ii�\!��Q��R<�Ќe$���f:&���gZ��uf�o�Ӹp�(=������ހ�._������Y�0|�p���;��4���3E��벌
��"XԲE%-K1�ďi$�+�4 p�� n1s)�<.�f*a������N$�����?6�3�f��7eN�AC���j�p8�Z�5�����㵱�7�{��W��l��?�.i�uU&úC�������D���½�JɲHfqB����1�`pB�Ĳ>�$�ӓS�����k/W�i�[�H���1�׳�rg����i�J�����>�>�����ҍ���/lV͊%�!-�M@�2��Z�P��̖.Ӌ�c�q�j�C��o�?�)������yh���B���B��x�"��<���a�j���$�^��{�V��f�S�^��H�e9i�I�AW��	���������j �۫����:-�)���Ҕ�G�J@�b�)FR%�h}��v�(d�gJC
�w��ݣ@+7�&Ap�z�O��8�a��<GI��k�Lm�c������;�ɞ>�E-|���TU��k�����-ED���S���$2k�e%�o��-�l,��J�ܬ���~���錗�ըS��!PWk:�J6���/��m�y�ϻ=�����Q-5N/��TI���t�ъӘ�1
�KZ�6!V���h*͊�T��1��q��6�DP�㛕[���Pn�B(lF�m6÷�5#���5i�����9��j>[U�*N�r�G����^��\�ʂ��dFk��]��[����n�c�}�h������Ԕ���G��,�>�q�Qm��Z�i�G��i�L�d*ӄ�Ē�i�ߤ��h�a&���������/�
A׏!���kh���lqp���Zn��穅� �.���G�'�x�X;t��eA�6J���1Y��z%5�%���ł~cl?���1}+y�R3�Df��%�D�(�o\$�1x��fy�;`aӓi4J3q��BϴS�-7Ng����k���~���/����V[3��q�uV���9��
^��x�O�l
��(�{�}5/%T¯�KYl�H��M2�H
�Z*J	e�8�>�_3I��L�uxPL!s�`8�u��ol��gU^�`K��i�Ny�Vw�_�x-��Ʉ��`��>�Nc����Q%-��TU�����c߈Ɵ������H�4c��'f��$�Sqt[ZNi&������Mo��4�f�YR�̼W�\.ݯf���˯�j7�;��qm�Y#'ݗ���sm�]����n����i%-)��ъ3��}�/J|fY\��{1��K�&:�$�
SrZS�?�wH�س%ؖY���lv܍k
y͊��zI���2��3��9+�s'�j�ǅX�T.��@^�fۭ}-z��U)��W�)����h����J�Ġi��f�ɤ`F�����֧�3��T��u`/ۅ����9��#-����څ��.�-/�b�H[/C}���d��-9[m�3�O�[�qS�	ٝY_��_K�S,��
����Ғj
��S�- ��,J��o@�c�왢�M>�]�hƶ��k8���rm�ǅ)�^oI��o{�0�����g��ry\�>�7���Σ\�fӗ����[��=����^[8͔��s��J)+�)�s���(��n�����w<��X��S'-�w}�:�Ԇ�ظ��_mi�of������a�#�I��.�;u7�=ד~=e�K����y��
Z�L˳���Z{�E,E���hi`qBc�"��VR*%�,Lu"���r;��Cz��1�����pAp������!��]����/yQ,�S�|�맋�_<������s�E����H9��$�����H"�+�_��-K%!cŢ^@	�Dd��<��sC�OI�>(	�Î����f��[�����G�|AoV\q�C�߮��`$��x��=�گ�4l\Č4�þ��y�WiB�SA����ג�H�􏕔?��3eש"�3jf%�U�Cx �!n�X�~Z�Oe�fBr��6<23+�K pq=8�򞙁}r=��<����n�yZ������{d�ãM���K���f#9D�b�omZ�U�P�Q��WI��Uʌ0����?����DGh�XRiYi�d�3�y�7�5��   �`.�x��.iQ8��̢MHᩛ�(�E��Z�����w/�z*^[�ױ�o�͗^o&vE���`�S����^-�N��Rﴘ��Jݶ%)O��4f�)4�9��<P����%�f��!�2{��?&����)v���˨�k��a�b�{�=zZǋٳG�t@&i9������k���/�JZa��7�b�1�]��e��*-a	|'ř���2?8���߶�O(ÎIPh�N�ڱii0S�B���P4�]g_��?.��׮�������'r�]$����9�\�b�(2���\&���mI�+h���'-ny��uO���,�q����O)�)�_I�1$nK+(�V<sy�_�Ӥ��<]�
p���נ@���6�얇��Z�~\o�����n7��^���f���l��gTIK��x�7����~ۂ�*2��8��,�Y�R�8��̒[�������=�16��
�AT�y����'?,B�j-�����y�ˁ��&��u����*Y�Qk���V8��
Z���'�_���4���+��V!'L2��(C�-�%fd����54�x&f���N�m&o�.Le��M/a1�An2Qε��IHw�}�����y'�#����$}%�h�>47]�u%-i!�؏i	J3�]!�J��'�kN 8L	W24�h}�11��Sꀂ�su�����A6�YQ^\��&y�PJZ3w^�,�y^�G݉3]l�$����=�ُ��g�}-rǕ`�W�z���3F��(_�����TQ��t&�q��j�X)U`c����l÷iɳ��Ds3��5��f�CF��48~���_�4�S�|~z�����s�q�xm<����}J(cay��a�_��<!���"�Z�9x�xK�͹�3=f8M�P�R����dV�0�JHJ���zLCµCz�l��¢v���sh'�v���?�i��J�|��Z=��ڽ�ԗ�pUO���'I���m�4Q^���$���#���
�PR���)O�J�Z^F2a��B�����/�-J�lH.Bx���5q�&w�2����L��k����9�v�n�x����7ܼ<</��ɼ'Ĥ�WyBv�	�hZM���D"�D��zt�"�aF��ŊI���f�D*���>���ʔ�9��_mS
O�h���f4^�L��оZ��y�ٙ+�&�p��,�@��:/�j=�uZ�fS�Y���w�
R5����wZ1���yIY�2��bBF qT���Bf�o��7Z@�bNh�L�VWP����̹.5y+��6����S�
N��Q�]�{�����yjF�׋^���<�ڇ�TMK�*�-�6�
wǚe1��ҩd�J��4�e b���7�����¢�ߡ�2��Bn�\�s�G���ڽ�X���j�)i�l��$��`[�؈���M��P}�	��Q-�b���oL�ei�kܘ-���Y"��$�_(�D��`&��҂'I�r�b��؊�͒0qW	���i"�q����~z��q��?7n���y���c��4hx��*�ɩt����Tզ��������������]      �      xڋ���� � �      �   �  xڝ�[s��ǟ�?E|�F�Lծ�b��S4墀�~�Cԙ�L2$��M���z��Z̽�����<����bm`�G�1�ѹ�t�1�����E*#��|s��~�幗��0��~��� ������	���IQ�sܓ�$��}-~���D&9�$ѡ���E$�D�Џ���ذ���<e�W~Y�i��,N�5��������4 ^���[�@#�F-�դ5�!�h+{���bC�j������ۀ�;�ط�}>�nx�~�u��I�5�����BbS�Pr5)��߂8g���˺�j����n���S~e�>��_��o�vX��f�߹r�q ,��?�ǘ{E����Y2%�.���B���lƒx~B�N��؜O<q0J;�:��e�����JLt���d }�IC�H"�fjs�;���%~ہSʒ������]ڰY?���y�(��<�ANv}e��2�/򸊛�bl:�,����te`��|m����;Xyr�w�l!E]���{�i��y/�X�{3�@C�?����k,tÚ���oy,`Ͻ�5�џ� j ���#�'2�m��f��m���,b*�Jj��[SP���Ft
�uB�N�I����s}#����^�;�w�B�;�5$$!p�S�ti,	�Sh|_C�7hŧ{n������G�p�r��@�l;� �Ӱ�����Vk<�,�e�l��;޹�4�.�Ag:_�kiwC
��$�}�$���L���JJ��>� ����y��R�@�Rp9e�4�twʌ����`R�f� h�ص��X9Ja�;���������kd���T�g�|n)�>��Ԩ<j�s/�CVm)R�Q�5G�S�r��m	�B�v�ux����1n-�2���9]/�����hv	4�'��?�xDKS}�$���L�ƴ�␦ϓ�3� K��([Zs]��N�S�V��^lF���/����vl-�f�ؚ�
�+'ãꆑ�3�9}�8���"�c����S���V�$�{p��z̼��3�?r7�j������{�-�ͬ�D�m��2��
͐��=umb3�od&b<GE���GD�&���W������U�<�Z����>X���j�If�(��u�乖P�тҰ�L�8-������w�<�O���ோ���ˈZl�~�V�8Q��������B�j#c�o�{+�lV;#��z�������cao뢻^t�u{�L��D�B�Ot��_	�%�u�n�[{�=�=?cd��q<�����V?V�!�6�2�W5��n��[��;�4�Ф�����}N2o1˻�VS��zh3	�&/~�;	~���N�C�|G�S�!,bX���t��f��O�Q]-4��cm�"mY��^o�q
�x���x �˖o.��'���(���L�I�P-0��|y��4��*3r�0I�Y��o?�*M@�a�]�&���,5��:�ss��'wjET���ۓV�b��jb���o���<#��d�;w�
L �B�9���>�w�JM�y�X�J2�<�\�237���5��;Y{n*��n퐍�t2��Yk��_/2 V���l�.ۍf�!4�A&��S+�J9�e,�h�����,�H�G��C+5K�'a�J%�������9�D#ô������if�ǳ�4�.:��b�C���C�[�����R�j=��x0������9��Ջ8�i��K�Wp�Wb�\Y7h��{�����7�lϵ-BE�n�K��=Q��l���]*ζrpB��J�u�w\&f�U]�4�_��c~�:+ͥ�̭�*u3��}ɘ�O�k�*��
�q[��ݰ�̳�j���wm�vs9Ɏ�-���h7��:޴bY�D�joL�"=��>~�e�X�eR�E��c�;��%5�E�]���qc��n��-{P��A�l�r/��d�8M����3|ؔ1	�!M���A:�iTr�|%^�W�a̗�
l�����Ჿls[������E�f{k��a���4>5%bԭ��V�t*-bΙ��L�9��Xu\<$'f��Fެ����+�ݥ��~�y�r�Tb�2�W�<M�˰g'[���"�),n���Q2.�u����|2��m���թ�v)��mkK�wL����:&|�	_a�0a%fYw��Қ[�8�������u%�S~V32�p���e>��n[ƚ�c+7wsoV U�m���P�N�xI�_�Do1�+L�LT�)J�a��#�z��04&h@qǒ!t嚻��VWסؽ4����iG��M�H�M$7��pZ!��eL����?���B�����)B��'��A+�k.�abF��`(ם�f@��Ѩ_{{���j-�k���lv��p�)R�&<�_�<���r�J��/�K����R��)/���S��x��R��K��w���ó���$2��S���w��z��4����&H���\�p/�6X8�`�|���}|� U��⠴�Z���}�H*Oi+RR���	��ƫU^�۽��̫��fך芇g�O5�.�Y<�P@�{��b�����o��?mTh���I-���Bi*^��A)�ֆ�k=++��d�jn��ڷ�,]7�������w$v�?*4�l-��M`"I��5�}|߈RK�@��~��C7�[���P�|�ͨP�Y\N��(p<4�I\Լ�қ��1h2n��A8.(���PBoC������Q�?��J"�QWqԴM�����9�w岚����T�m����ĕ�L�T�C=!�P���YhU�΅ļ�%��pG;����P^���m��;��h�Q��H�(�N?������_����̻<O��٫Z ���@%4r4g_��h_��`ei/�9{��O��u}mdRk�vЌ�J�x�����&[W���0'�Ķ�|��$�9������P�x��m�����H��(��d�v�/��G m��>�����Р�q�^�={V�C��l[PJ��[b�����ޗ�}V:�K�2��a�4��sT�kY"�):����@���ڥ��uA�D�tYu5���F1��NN�>�ƣ�J��r�'���P�ֶ/!m�Ҫ�7���'ݾ�!^�T��9��NQow:����~oh�܁ �S{��@��w�h01sS�������Rj���Ӣ��c
�-f�~�	��wL�T�ci:��Ur�潶�m^X�_gj��vxUf'H�h$Iq����]�A}���Yb}��2:H�xae�����9?z���RF�ST:oiT~��4�����t�      �   �  xڕ�9�$I
��ʻ����!����Y=���,��$J
a����D��[��n����-~��#������߯�?���m�?���r�]���B�Q��U�:��g��u�1̨�Q�B�%�jC�;�6��,�+��ͼ	dTP�v�nI�P�z_�U�w��8,��!�@�m�����~�����ekQ�R��wdX�+����3*��^�W�� �-t���+Z;��@&
���dJ���슺��b����J�n8&3�J4WE�v<�|���U�Ţ�`jF��*�mm�I�,M��ڡI��F>��e��V�-ۣ�VPB�s�g��R�0��	�R�®D`KWK���vΞ��3_�:���ҙR�T�����x��U��]��ze�x��yd{�qI�B��z��H*��W�l��I%��23�nS���ȄY��ߊ����,�6<�w�ډ�Nh��������|�Je��UZ%��q�e]��\*7��{re��V�֥e���E����wv�����@~�⌺ƭ���fT�K�͋���,q�����+�����kx��W��z�*p8��V6M���T���B�Q��+]��gfT�$��+A�(���/�_��w
1���3Ov�߸�:a������u��]�>�g*��￻`s??S��DF}4xm������O���Wū4���k�X����>�Ԅ�S�s�|I}���#� �]p�kj�ۈ��͹i�>a@G�|�vYF����e����X���}\�{6��g��AZ�5 έ�Lũ���zn>��L%�qn}��0�;>���B���d��y��3ʗT[~������a {?7�K�B/P	֜���1�@�K�+K��q�@�q>+�p�;.����
�و~�ʌ�j���ܱ�&J��p�?�?��Q��q?���z�{j��-Ϩ>f�P�:�l�L���|��G�W0<SQ��(������{?S)�G�B��v%��^�����{�      �   �  xڥ��r����S�:��eiOjj��x*��d�ˁŌL�(j�}�5QK6�u�,e��Ϳ�6��ڌ4S(BMRR����Wh)f���i�O����?������R�5��_DIHu��/J�qs<�V�%7��:�������H����~������I�U������/�@ns:����0����m�LZ�nc*^�Xn#� ���p�nd��[$����ָ�����6��2XF�����T�2�m�\�����U2�o��Z#9��5��FTR�z����SX�6�R�m�+���`�t573��"�q$��`V��x�
�m���+��"G%Hrs�,��k�U�����&'��$�Cj5:p݆��d/ָ��$���m��EUV1���1�JE�۷Arp�"	�RSd�$ 7��
���R(#j�\�1��~�(	�d�%!�1=}M���I�!ե�� Ar�V�۠���zXx�6ĵ������ۭOkŐ�`���+�UnC*Ҋċ$���3ܶ^�<�V���$F�̚H��x�$�uB�*8n�k���T�����z�(	�xmx}�z�3�m�jSaH�q� ��f����TzV�Q�6�'n;�&�װ�b�q"{!UPk��TzFǛKbܠk.�=���T��Ar��V���dy9	ƭE7N$���0Z}�$M��n@�S�&��*Yz��nP55NNT4i�W��Xa��A��~�n��ṍq���|;�>i2C������k�mP��Ƌ$�J�3��@���KQ�ܙ;Hv&�n�*1[V��9�����U���6Z�������c�ۘJ���$�UJ���Ij�g�Đ�cF�\H�XqU���׷!��`c}�70*�!��}#��p�%Q�2�oCܠ�r�]��@EY�Ԟ3s��T1F�v�@nh"r�v)�v�j�:h�u#��Z��mL�dG<�!n5������gj���;(�P]�1�;��7��8nGc�QY���$�<�1��6��(%��7�Ѻ�+�}����(n��%�5qS�Z�m�KUN܎�3�Q^�C�u#'��DH%	]�q�Z�=''I���T["w�ɩ�Z+�UZI�|�&�e⸝t�~��L-~����!rV&��۠JPQ�܆�-��Y'Iͩ2XǭYH��q${�j.	�T٘nC�\��%�U9��*7'��шU�P%Z�iy�;>��$�֚iH�S��u#�$��!��d��pKT���Z����!�W|�m�\�Z�oc*I�����G;���&Gmx�T����d�՚�mP�͛KB�j��|�VM��!5��� �����T�Q��b�h�䌒5�V��X3�m�\�]�6��d���$�%��挒$I�4�)�n�d��nc*ژ���7J'83w��aiHuZqg7 9�:u���*y��6���&��S�EY:n������mLōv�߸qcH����hRCj�۷1rR��DP%������с�wCB�heHM���� �
�V�nP��*kv�q�T�3V�Ȉb����;e(��|TQ�V$�6XΧ�h���h���8�b��Dr���T��L�!n��s~�7В���N�w܆ȥOo��1�H>��F�V�~%n��|Q�L��w��}X���G��;�u�DN$�weF�* �}��$ 9�h�ۘʼ��s⒈�pܮY[5�ZE쾍�c�k�6�BE�r��m��do ���lQ����[�� ��T���6�*kN�v���!�)�nc�ל�GUj����q�ȆշK�T�Tk7n��̚�T!��m��U)�3����zt��Eq�6HvA��$�J��'aܦ�L�H�T��������LC���5}TI�w��6�sԌ�{o��K#j�0�Fɦ�ٻAU�4��m�kE	����݈*I��%[�ָ�dY�$�Ij!+Iz�ES�SN09Xz��;�R��씡�����ϻ���]:��ߴ^��+f#�W�O���ha�(�������6����4��s�.D}����m�����ݿm=l��h_7i�N�0=U�Ki���t"=Jrz������ce������S�>��i{:>�n6����{)���,��A�M_nz��>�c��Km:��j�b��k=]���is��B$��`���8�A��Qj�p<��W�Kea��W2������?�:n���ōab�����B��}�Vj���M����_�Zc��y��/����~S�_�l�%�|���|)�K����6�0_̿���xJ�:��=��6� �)sq:����!Oi�B��曲���4�����}z�I�����#������]���a�[�T����t���~����п�۶�����M/M����Z��6x�o��]���������MЋ�
\�e3I>�����ߝ7���U�.z8�P>��p���n3���&��:=�_^O#T`�2���&��T��q��nw�M�k�s�/�}�xG�}2�ػ�������ۋӹ�r�1R���Ǧ�Bܯ�������i�u�L����h<t��������6���o��~��i..ީ�����(?<j<���R�ǵ�:=W�Z9F/�B���7��;���Ϸ���R\�a���!�ώ�"��+��x���{YY�Sc���)QQ����f{�p��#MOZ�o��������-����o7������sa�{���O{�og�M��.}�m�|���|�N|
��|�~�ߚ�>���ӱǿ|�NOU��v�n���P��gf�:���W���f��,486��xx���Oӹ<�ˋk��p�:���2��g�_7�P:�K�w�{��Gm<�W�~3'f�zg�6�s1,$��x'2��a����{�?6���si�p�Ql����&���<��Nz7�&ϕE��FJ0���@;�X����������Û�48S�P_��d��	�[�X%�Ň�ު,Wr n(�'���uO/�}���nV��O(\k0S�2O�7�!�ͺJ�g	��|u�U������Z7��=dhs�EK�Iۚ�_�����6J����sT��Ӯ
�6�%��e�m"S�5Cj�A1���e��mL�)g�m����R���J-����r&7�kn�*d��1���k�#��@��z�
�m���K�$����q܆�*;�m�m���I�s%�����U|�]��F�I�X݀�� {'��ݙ������S���n�*�db��qmY+xܞ�2��6SE⹍����۰J#���יҫxN27�U���0����~����U���.P�!�w&��p�{��3�J���&�lW���	�$��7��ufD�(rN��t��7�m�\��+�FU�q,�1n��p��p�L�F��r���6H�"��ۨJ���6���P���n���mר�\��v&�����6�b��|��6��"Jx��|jL-B�r�e���������+�1nVVI��Y6�Ր��c�m��E�b�۠�s��$�Ugn�:�!�(�yq&���?��U�-�W��|R��`�v�Y9�&b����Fj�۠J1�8�6�ͦH'��MoЍ�fHM�޺����� Q��+��Q�>�{z@j�l�TuP�֞����M��Էk�Y�P�����*I��*�� ��E��p��\(]�U��|�=�6J.�ig�}n�*UY�8nc\��<텀n�6�U^��t���1�m�ܧ�b�۠J�����4җ�9`n�VKjH����(�r����4MJq܆��xSb��v�U�ŐZMb���k�6�U�!�O�/������܈�Ԭ�7n��(�-�wUq��@�F���ۇ��'�E      �   �	  xڭ�Kr���W��<e� 	z-���%�m�9ɭ��O�=�\��5?H�c�N=�V� ��Gb���ȩH�!�ر�p���?\�)�'�'%�:�W�֬U��D))�����%��[�����r�����E���G�{i>/��|�cf�俈�wԴ".4�=/����X�O|,1���R\���L�+�H-�}b)�|rvaA\}��W�ׇtEl������obsi�>�8�*aE�k���{b���8��x�Z���8;�q\Ơ��g�Do���G��0-sE���>��|�Zo����e�eT��t������>1��W�R�=Bܧ����<�o�'��ܽ�2�^q]�J(Ӓz�ZyYtȁ�%:K71ws�1�VV�8{[e��{
���/��,7ե��P֒��ǡ�t�c������g�|����kEl��A����"�Y��"ʄ	�얍�.}��(���n9U�Tp
�V�m~�v��i[�M\F�5�%ϨX�d~��Z"ݗ�T^%/76�G�kM�*�y�E�����?�mx�W>#���}x�".��ߏ
eo������	��\m�8.2����)*��c�̓�4��͐����������E|��T�r��EjLK��K�!��$nq�b����`C�Qk?���h�ǐ� ���T�Hʼ�cl�A�&%�qT	�P�)| %lcB#N��`�sq�� �Q;c�,6���s��@M�gac��B�	KQOQ���qb,�1����
�(8����v����Rk���X靎u���D����B}@�N�1D<f���O�Y,�������nd/�:�%�st~�:���w{N��1�O�P> qb�X���3���'W�c-F�䏈-�1��0��� *tv �A)!�X�5�3#o�1X�1�h���±A5���@Wx�D���c�ll~a:��٘����ա+J����H|p��#�L`,�a�V�@VD�7��0������h�7�Bq�v��E�Nc�"N.��b��6|�I7�8vB�5$c�#j��n>9}�#Q��
�8G9����⎏��	"�Da�x��b��*�>FF�,�qT�6�+0C��Ų������W`���=;�
J�=���#���W����{��:���6"�C> �0F����w'.N�ل\�-<��9v����7|�I7����AP(�>Մ��jj��$*<�'y����������>���A��L��j���32=N�V`���A�.��cHcĞ|<� *>�j4FC>���k�u��Q������g[u�K���d3(^Q��=2�N�¢'D�����gɜl��uÈ����8�16����-qt���2�12d��h�m�3o�8Ή�3>F�L[�`�>	+N�
���Ēt�ǘ�����|��Y6�����';��#�׽
��XrÀG:�t��,�1X�!�~�b��7����F|"�]���t�H�N��
	�ޭ@�����)�q��k~e��!FF�;s�����^7L!bL�c���L:zJ��n����8r�W��A��g�s��	�C�	!������8���(�J4ī��4� ~+S`�#��`�8���1�	7�804�S��[j׃�܆\�a
������+1���Uaq�B�5�M�,�⩍_:"��1F��;��$)�QQHKzd
!�B���˧��2}��i":}BkNK����3[ܬx��4��=��bj˕׸���ʛ�f�+�2z�}����"�6�"7uS���E�o����T�5[�>Vi �qa�eI�Y�~Txvzo·.�7z�>��+ڽJ��!���
���q}�Ǖeq�"�`��Ͽ�﮴*Rx������q�7��ڊ}�5�*��ٕ��ʋft�]�&b^M�bĭ9���(�|��{#��"~�t�}����_g�mh	�H*�/�Co�7��w�4:��H���\8���:7Sڝ�G���d�Ѻ�E>�΍�; yS�;��mY�0C�����7�1b�ZW3.�(����2k�Wn�"��BFv�K[�F^��u��Zvw�/��������jJ�q��/��ۯ���#��7h�g<�G]M4u��}+��5��"�D���(�Q�eL����8�ݷ@�	�(q���q1��1����Yw�B_�F\w�U�ĳx�M\]V�1����)z{7M�!FV^�Yd�8\W^��'Y���_W5�����"���^�3�_�ÏU�ѭ�,j �ʮl���%ܓ��D�ձ�|�&�m����%%���O�]������;�8�^�5M\�nX��:��.�α��9�9}K/-�d��Ǘ��wq��& �y����o-}X�E=V��P�������Wn#��u�2��UY�h�#��\�O&�d�#�lQf>�!?��R�?�_>�!e��/Kb�{�!��*�8�\o1��E|�K+�����#��bO�?�GrRf��kE�:-~KL���R޽�r�`��M@��RN���,}�������>ݥ�      �   �  xڭ��n#7���wI!Rԁ�}�}�����M�q��&E߽�Q.
,*�,��Iė�')Rq�g�������;F�7_G��p�=?��O��K��/��|w���Tn�Η��o!�`zp�0ɧ���$���z���Pň~&*��A�ل+���|)O�\^O����(�.(gܡn�@H<W$p���`����ʦ����F��?" �v�����v!H��Ոm6e��`4s�G6�x�*L%�����I�!AE�ψw�r��!<kjFl��M��yҟFe԰""�:�9���D�0�
�fN���j����� o͈M�d�ZZ�����2���:��J 
�iEb�j2(f_E��n��}�Q7#6A@(ijEh��[c@ƌj2`�jjEh-C;��G�9���;#����ԇ`�[El�0hxn>���5�@1ԡ��q9��X��`��F�.#����{�BH:Zߌ��is�"��<F���=���kN5�F�1F������.�' �� b�v���!5"{3�Ɍ�<���jgDH�!	��~������܇����	�e�A`��lM�3"�-B欩��4#�R)��1E�wX�g~(��V#�@d@�h�^�Ѳ^/2HpÍYf����	4 ��I���eD|u�*������aA�{�6��e��^��L����	tl}?�P��ׇ.(��qDB�͔�*�`Wj�~D���{�Ӌ��hi]�7B��ʀFi�d��td�;e���ԻnZ X�u+D��ta��n�M����f!���ڝX[y��t*Cr�ם.�۹BB�koV#�A�ijY2��M�\�5�Z)��O2�C���Q�*�M�E˂�&^>zQ��^�	n}Q#*l�T�W��� �K�j ����FE{��S	<hC��C�C�2mN%`�֗�fgS$h�:U��1�{�dlY덩��Ӿ�������!���%J�Cef6X�p��-EƁhG�P�>n�����Y���&�J6����;0�Ě���(*��H�d8�[�ܺV��ȰB$������ ��,��!����j7��GY>|k �=��l�HM�Z.%������?�:�0�@&W��\N�%���O�z.mj�C�\�)��CKpW���Y�k2�O���eT��8gܒ<p�����o���_ ��      �   �  xڥ��n�6���S�8�D�����[�9�ER݌�RCR��<}J�el���at��mI)�	/H�a9���Q��Kk
�N{׆<�}h�Gۇ��n�u��z���ƺ��w�0�	�	ψz�H�5�
�!ɨRC��S�N���WJ��;�������|�*�u�Ѷ}�n�ݧo����:�ʨ*�h���Pi�[և2�!;�]��2����y�á��iF(aIP�r��ZP|�]PTς��Ǫ�}�N]���g�.[������6�²i"���$/��U�u�©�gy����~�T�t=V�/�E	�)OCj7Q��|���9/j����y$lcq�GQc�-�<
*�i$���
�WAױZ"�|�����8�fV��ϛ2/ڀć��.)��T�eŨ�WY��F�%�� ��y�B^��8���p�SMch�2]�Fhͮz����s��@_B���J������Ő�}���iTm~��f1��12�Kv�k�n��ϱ��0N���è�tځ(v��QF.�_�i)b�����G7`ƺn��&�0��4M�����Ȓ�D˔/���bQ~��`_��9=BG(Kv<p���+	ya�y=�m�Q6��Y<q/��*�BYۡ^S-\��iV	�nԤ��@�XE��y5C��J!�m�p移g��R�kӯ�Ԭ���v��m��P���P�Y�ڍ�^'0�62���	��\M�HA������. ڦ�y����n4G�$�5�Z�ʺ�0Z�M���1�M������R��^j1�?�`��X�3t~���kF�Z���7�J,���UN	��U�u��­��m�U��CxkM�S��)��UOY�rї�8?_�h����U?(Z��|��G gD@ ��X� {�(_0R_G=�'ON�0�%�.��Ӎ�J��r���7���'J�"���4�0���`bx�1m`�3Q���Z��9 �$]�����{��ݷ��7��{�;�@$�P���.(ۄ�0�	��Da"�$BC�VR!�6X���H�;��O8����40��&6�	+�<�ӗ��>�t���X�=;=1���F�T�*MUbr^�g;]��-9��ě�Q��+p~�MlPd�k\�$��m��dX����Q�'�i&<IĴf�P*�Y �ͼߺ{�h��|6BwS�\)��p}��-|�����A/�����]f��y	���s
;TR2J�ݾR�n�{��d��+@%&�7t��A/����c&Ӭ�Ju������(���Ȫ�ﲦ̎�����J��0��a�
�@7��ۺ}�R9��:K�E�����h�%cYr��b��pmxn�b�K�)t�%^vQ!����Y�G�E�T��m^�e��%��ƚ��%�0�8A�0�u��޿zN���.�HQ����?�}��4�~$b�$ʄ6?a��*78F�J\D�W��#�堍�0�u��Ol�%��ëG1�_�F%ۀeX��Ť�ԖW[��y;�K�H⏨�b��y������u7     