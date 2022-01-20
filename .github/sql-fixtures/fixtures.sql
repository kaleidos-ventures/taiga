PGDMP  	    '                     z            taiga #   12.9 (Ubuntu 12.9-0ubuntu0.20.04.1) #   12.9 (Ubuntu 12.9-0ubuntu0.20.04.1) �   �           0    0    ENCODING    ENCODING        SET client_encoding = 'UTF8';
                      false            �           0    0 
   STDSTRINGS 
   STDSTRINGS     (   SET standard_conforming_strings = 'on';
                      false            �           0    0 
   SEARCHPATH 
   SEARCHPATH     8   SELECT pg_catalog.set_config('search_path', '', false);
                      false            �           1262    9871271    taiga    DATABASE     w   CREATE DATABASE taiga WITH TEMPLATE = template0 ENCODING = 'UTF8' LC_COLLATE = 'en_US.UTF-8' LC_CTYPE = 'en_US.UTF-8';
    DROP DATABASE taiga;
                taiga    false            x           1255    9872421    array_distinct(anyarray)    FUNCTION     �   CREATE FUNCTION public.array_distinct(anyarray) RETURNS anyarray
    LANGUAGE sql
    AS $_$
              SELECT ARRAY(SELECT DISTINCT unnest($1))
            $_$;
 /   DROP FUNCTION public.array_distinct(anyarray);
       public          taiga    false            �           1255    9872832 '   clean_key_in_custom_attributes_values()    FUNCTION     �  CREATE FUNCTION public.clean_key_in_custom_attributes_values() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
                       DECLARE
                               key text;
                               project_id int;
                               object_id int;
                               attribute text;
                               tablename text;
                               custom_attributes_tablename text;
                         BEGIN
                               key := OLD.id::text;
                               project_id := OLD.project_id;
                               attribute := TG_ARGV[0]::text;
                               tablename := TG_ARGV[1]::text;
                               custom_attributes_tablename := TG_ARGV[2]::text;

                               EXECUTE 'UPDATE ' || quote_ident(custom_attributes_tablename) || '
                                           SET attributes_values = json_object_delete_keys(attributes_values, ' || quote_literal(key) || ')
                                          FROM ' || quote_ident(tablename) || '
                                         WHERE ' || quote_ident(tablename) || '.project_id = ' || project_id || '
                                           AND ' || quote_ident(custom_attributes_tablename) || '.' || quote_ident(attribute) || ' = ' || quote_ident(tablename) || '.id';
                               RETURN NULL;
                           END; $$;
 >   DROP FUNCTION public.clean_key_in_custom_attributes_values();
       public          taiga    false            v           1255    9872391 !   inmutable_array_to_string(text[])    FUNCTION     �   CREATE FUNCTION public.inmutable_array_to_string(text[]) RETURNS text
    LANGUAGE sql IMMUTABLE
    AS $_$SELECT array_to_string($1, ' ', '')$_$;
 8   DROP FUNCTION public.inmutable_array_to_string(text[]);
       public          taiga    false            z           1255    9872831 %   json_object_delete_keys(json, text[])    FUNCTION     �  CREATE FUNCTION public.json_object_delete_keys(json json, VARIADIC keys_to_delete text[]) RETURNS json
    LANGUAGE sql IMMUTABLE STRICT
    AS $$
                   SELECT COALESCE ((SELECT ('{' || string_agg(to_json("key") || ':' || "value", ',') || '}')
                                       FROM json_each("json")
                                      WHERE "key" <> ALL ("keys_to_delete")),
                                    '{}')::json $$;
 Y   DROP FUNCTION public.json_object_delete_keys(json json, VARIADIC keys_to_delete text[]);
       public          taiga    false            �           1255    9872956 &   json_object_delete_keys(jsonb, text[])    FUNCTION     �  CREATE FUNCTION public.json_object_delete_keys(json jsonb, VARIADIC keys_to_delete text[]) RETURNS jsonb
    LANGUAGE sql IMMUTABLE STRICT
    AS $$
                   SELECT COALESCE ((SELECT ('{' || string_agg(to_json("key") || ':' || "value", ',') || '}')
                                       FROM jsonb_each("json")
                                      WHERE "key" <> ALL ("keys_to_delete")),
                                    '{}')::text::jsonb $$;
 Z   DROP FUNCTION public.json_object_delete_keys(json jsonb, VARIADIC keys_to_delete text[]);
       public          taiga    false            w           1255    9872419    reduce_dim(anyarray)    FUNCTION     �  CREATE FUNCTION public.reduce_dim(anyarray) RETURNS SETOF anyarray
    LANGUAGE plpgsql IMMUTABLE
    AS $_$
            DECLARE
                s $1%TYPE;
            BEGIN
                IF $1 = '{}' THEN
                	RETURN;
                END IF;
                FOREACH s SLICE 1 IN ARRAY $1 LOOP
                    RETURN NEXT s;
                END LOOP;
                RETURN;
            END;
            $_$;
 +   DROP FUNCTION public.reduce_dim(anyarray);
       public          taiga    false            y           1255    9872422    update_project_tags_colors()    FUNCTION     �  CREATE FUNCTION public.update_project_tags_colors() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
            DECLARE
            	tags text[];
            	project_tags_colors text[];
            	tag_color text[];
            	project_tags text[];
            	tag text;
            	project_id integer;
            BEGIN
            	tags := NEW.tags::text[];
            	project_id := NEW.project_id::integer;
            	project_tags := '{}';

            	-- Read project tags_colors into project_tags_colors
            	SELECT projects_project.tags_colors INTO project_tags_colors
                FROM projects_project
                WHERE id = project_id;

            	-- Extract just the project tags to project_tags_colors
                IF project_tags_colors != ARRAY[]::text[] THEN
                    FOREACH tag_color SLICE 1 in ARRAY project_tags_colors
                    LOOP
                        project_tags := array_append(project_tags, tag_color[1]);
                    END LOOP;
                END IF;

            	-- Add to project_tags_colors the new tags
                IF tags IS NOT NULL THEN
                    FOREACH tag in ARRAY tags
                    LOOP
                        IF tag != ALL(project_tags) THEN
                            project_tags_colors := array_cat(project_tags_colors,
                                                             ARRAY[ARRAY[tag, NULL]]);
                        END IF;
                    END LOOP;
                END IF;

            	-- Save the result in the tags_colors column
                UPDATE projects_project
                SET tags_colors = project_tags_colors
                WHERE id = project_id;

            	RETURN NULL;
            END; $$;
 3   DROP FUNCTION public.update_project_tags_colors();
       public          taiga    false            �           1255    9872420    array_agg_mult(anyarray) 	   AGGREGATE     w   CREATE AGGREGATE public.array_agg_mult(anyarray) (
    SFUNC = array_cat,
    STYPE = anyarray,
    INITCOND = '{}'
);
 0   DROP AGGREGATE public.array_agg_mult(anyarray);
       public          taiga    false            �           3600    9872319    english_stem_nostop    TEXT SEARCH DICTIONARY     {   CREATE TEXT SEARCH DICTIONARY public.english_stem_nostop (
    TEMPLATE = pg_catalog.snowball,
    language = 'english' );
 8   DROP TEXT SEARCH DICTIONARY public.english_stem_nostop;
       public          taiga    false            �           3602    9872320    english_nostop    TEXT SEARCH CONFIGURATION     �  CREATE TEXT SEARCH CONFIGURATION public.english_nostop (
    PARSER = pg_catalog."default" );

ALTER TEXT SEARCH CONFIGURATION public.english_nostop
    ADD MAPPING FOR asciiword WITH public.english_stem_nostop;

ALTER TEXT SEARCH CONFIGURATION public.english_nostop
    ADD MAPPING FOR word WITH public.english_stem_nostop;

ALTER TEXT SEARCH CONFIGURATION public.english_nostop
    ADD MAPPING FOR numword WITH simple;

ALTER TEXT SEARCH CONFIGURATION public.english_nostop
    ADD MAPPING FOR email WITH simple;

ALTER TEXT SEARCH CONFIGURATION public.english_nostop
    ADD MAPPING FOR url WITH simple;

ALTER TEXT SEARCH CONFIGURATION public.english_nostop
    ADD MAPPING FOR host WITH simple;

ALTER TEXT SEARCH CONFIGURATION public.english_nostop
    ADD MAPPING FOR sfloat WITH simple;

ALTER TEXT SEARCH CONFIGURATION public.english_nostop
    ADD MAPPING FOR version WITH simple;

ALTER TEXT SEARCH CONFIGURATION public.english_nostop
    ADD MAPPING FOR hword_numpart WITH simple;

ALTER TEXT SEARCH CONFIGURATION public.english_nostop
    ADD MAPPING FOR hword_part WITH public.english_stem_nostop;

ALTER TEXT SEARCH CONFIGURATION public.english_nostop
    ADD MAPPING FOR hword_asciipart WITH public.english_stem_nostop;

ALTER TEXT SEARCH CONFIGURATION public.english_nostop
    ADD MAPPING FOR numhword WITH simple;

ALTER TEXT SEARCH CONFIGURATION public.english_nostop
    ADD MAPPING FOR asciihword WITH public.english_stem_nostop;

ALTER TEXT SEARCH CONFIGURATION public.english_nostop
    ADD MAPPING FOR hword WITH public.english_stem_nostop;

ALTER TEXT SEARCH CONFIGURATION public.english_nostop
    ADD MAPPING FOR url_path WITH simple;

ALTER TEXT SEARCH CONFIGURATION public.english_nostop
    ADD MAPPING FOR file WITH simple;

ALTER TEXT SEARCH CONFIGURATION public.english_nostop
    ADD MAPPING FOR "float" WITH simple;

ALTER TEXT SEARCH CONFIGURATION public.english_nostop
    ADD MAPPING FOR "int" WITH simple;

ALTER TEXT SEARCH CONFIGURATION public.english_nostop
    ADD MAPPING FOR uint WITH simple;
 6   DROP TEXT SEARCH CONFIGURATION public.english_nostop;
       public          taiga    false    2208            �            1259    9871580    attachments_attachment    TABLE     �  CREATE TABLE public.attachments_attachment (
    id integer NOT NULL,
    object_id integer NOT NULL,
    created_date timestamp with time zone NOT NULL,
    modified_date timestamp with time zone NOT NULL,
    attached_file character varying(500),
    is_deprecated boolean NOT NULL,
    description text NOT NULL,
    "order" integer NOT NULL,
    content_type_id integer NOT NULL,
    owner_id integer,
    project_id integer NOT NULL,
    name character varying(500) NOT NULL,
    size integer,
    sha1 character varying(40) NOT NULL,
    from_comment boolean NOT NULL,
    CONSTRAINT attachments_attachment_object_id_check CHECK ((object_id >= 0))
);
 *   DROP TABLE public.attachments_attachment;
       public         heap    taiga    false            �            1259    9871578    attachments_attachment_id_seq    SEQUENCE     �   CREATE SEQUENCE public.attachments_attachment_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 4   DROP SEQUENCE public.attachments_attachment_id_seq;
       public          taiga    false    233            �           0    0    attachments_attachment_id_seq    SEQUENCE OWNED BY     _   ALTER SEQUENCE public.attachments_attachment_id_seq OWNED BY public.attachments_attachment.id;
          public          taiga    false    232            �            1259    9871627 
   auth_group    TABLE     f   CREATE TABLE public.auth_group (
    id integer NOT NULL,
    name character varying(150) NOT NULL
);
    DROP TABLE public.auth_group;
       public         heap    taiga    false            �            1259    9871625    auth_group_id_seq    SEQUENCE     �   CREATE SEQUENCE public.auth_group_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 (   DROP SEQUENCE public.auth_group_id_seq;
       public          taiga    false    237            �           0    0    auth_group_id_seq    SEQUENCE OWNED BY     G   ALTER SEQUENCE public.auth_group_id_seq OWNED BY public.auth_group.id;
          public          taiga    false    236            �            1259    9871637    auth_group_permissions    TABLE     �   CREATE TABLE public.auth_group_permissions (
    id integer NOT NULL,
    group_id integer NOT NULL,
    permission_id integer NOT NULL
);
 *   DROP TABLE public.auth_group_permissions;
       public         heap    taiga    false            �            1259    9871635    auth_group_permissions_id_seq    SEQUENCE     �   CREATE SEQUENCE public.auth_group_permissions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 4   DROP SEQUENCE public.auth_group_permissions_id_seq;
       public          taiga    false    239            �           0    0    auth_group_permissions_id_seq    SEQUENCE OWNED BY     _   ALTER SEQUENCE public.auth_group_permissions_id_seq OWNED BY public.auth_group_permissions.id;
          public          taiga    false    238            �            1259    9871619    auth_permission    TABLE     �   CREATE TABLE public.auth_permission (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    content_type_id integer NOT NULL,
    codename character varying(100) NOT NULL
);
 #   DROP TABLE public.auth_permission;
       public         heap    taiga    false            �            1259    9871617    auth_permission_id_seq    SEQUENCE     �   CREATE SEQUENCE public.auth_permission_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 -   DROP SEQUENCE public.auth_permission_id_seq;
       public          taiga    false    235            �           0    0    auth_permission_id_seq    SEQUENCE OWNED BY     Q   ALTER SEQUENCE public.auth_permission_id_seq OWNED BY public.auth_permission.id;
          public          taiga    false    234                       1259    9872511    contact_contactentry    TABLE     �   CREATE TABLE public.contact_contactentry (
    id integer NOT NULL,
    comment text NOT NULL,
    created_date timestamp with time zone NOT NULL,
    project_id integer NOT NULL,
    user_id integer NOT NULL
);
 (   DROP TABLE public.contact_contactentry;
       public         heap    taiga    false                       1259    9872509    contact_contactentry_id_seq    SEQUENCE     �   CREATE SEQUENCE public.contact_contactentry_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 2   DROP SEQUENCE public.contact_contactentry_id_seq;
       public          taiga    false    271            �           0    0    contact_contactentry_id_seq    SEQUENCE OWNED BY     [   ALTER SEQUENCE public.contact_contactentry_id_seq OWNED BY public.contact_contactentry.id;
          public          taiga    false    270            &           1259    9872847 %   custom_attributes_epiccustomattribute    TABLE     �  CREATE TABLE public.custom_attributes_epiccustomattribute (
    id integer NOT NULL,
    name character varying(64) NOT NULL,
    description text NOT NULL,
    type character varying(16) NOT NULL,
    "order" bigint NOT NULL,
    created_date timestamp with time zone NOT NULL,
    modified_date timestamp with time zone NOT NULL,
    project_id integer NOT NULL,
    extra jsonb
);
 9   DROP TABLE public.custom_attributes_epiccustomattribute;
       public         heap    taiga    false            %           1259    9872845 ,   custom_attributes_epiccustomattribute_id_seq    SEQUENCE     �   CREATE SEQUENCE public.custom_attributes_epiccustomattribute_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 C   DROP SEQUENCE public.custom_attributes_epiccustomattribute_id_seq;
       public          taiga    false    294            �           0    0 ,   custom_attributes_epiccustomattribute_id_seq    SEQUENCE OWNED BY     }   ALTER SEQUENCE public.custom_attributes_epiccustomattribute_id_seq OWNED BY public.custom_attributes_epiccustomattribute.id;
          public          taiga    false    293            (           1259    9872858 ,   custom_attributes_epiccustomattributesvalues    TABLE     �   CREATE TABLE public.custom_attributes_epiccustomattributesvalues (
    id integer NOT NULL,
    version integer NOT NULL,
    attributes_values jsonb NOT NULL,
    epic_id integer NOT NULL
);
 @   DROP TABLE public.custom_attributes_epiccustomattributesvalues;
       public         heap    taiga    false            '           1259    9872856 3   custom_attributes_epiccustomattributesvalues_id_seq    SEQUENCE     �   CREATE SEQUENCE public.custom_attributes_epiccustomattributesvalues_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 J   DROP SEQUENCE public.custom_attributes_epiccustomattributesvalues_id_seq;
       public          taiga    false    296            �           0    0 3   custom_attributes_epiccustomattributesvalues_id_seq    SEQUENCE OWNED BY     �   ALTER SEQUENCE public.custom_attributes_epiccustomattributesvalues_id_seq OWNED BY public.custom_attributes_epiccustomattributesvalues.id;
          public          taiga    false    295                       1259    9872722 &   custom_attributes_issuecustomattribute    TABLE     �  CREATE TABLE public.custom_attributes_issuecustomattribute (
    id integer NOT NULL,
    name character varying(64) NOT NULL,
    description text NOT NULL,
    "order" bigint NOT NULL,
    created_date timestamp with time zone NOT NULL,
    modified_date timestamp with time zone NOT NULL,
    project_id integer NOT NULL,
    type character varying(16) NOT NULL,
    extra jsonb
);
 :   DROP TABLE public.custom_attributes_issuecustomattribute;
       public         heap    taiga    false                       1259    9872720 -   custom_attributes_issuecustomattribute_id_seq    SEQUENCE     �   CREATE SEQUENCE public.custom_attributes_issuecustomattribute_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 D   DROP SEQUENCE public.custom_attributes_issuecustomattribute_id_seq;
       public          taiga    false    282            �           0    0 -   custom_attributes_issuecustomattribute_id_seq    SEQUENCE OWNED BY        ALTER SEQUENCE public.custom_attributes_issuecustomattribute_id_seq OWNED BY public.custom_attributes_issuecustomattribute.id;
          public          taiga    false    281                        1259    9872779 -   custom_attributes_issuecustomattributesvalues    TABLE     �   CREATE TABLE public.custom_attributes_issuecustomattributesvalues (
    id integer NOT NULL,
    version integer NOT NULL,
    attributes_values jsonb NOT NULL,
    issue_id integer NOT NULL
);
 A   DROP TABLE public.custom_attributes_issuecustomattributesvalues;
       public         heap    taiga    false                       1259    9872777 4   custom_attributes_issuecustomattributesvalues_id_seq    SEQUENCE     �   CREATE SEQUENCE public.custom_attributes_issuecustomattributesvalues_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 K   DROP SEQUENCE public.custom_attributes_issuecustomattributesvalues_id_seq;
       public          taiga    false    288            �           0    0 4   custom_attributes_issuecustomattributesvalues_id_seq    SEQUENCE OWNED BY     �   ALTER SEQUENCE public.custom_attributes_issuecustomattributesvalues_id_seq OWNED BY public.custom_attributes_issuecustomattributesvalues.id;
          public          taiga    false    287                       1259    9872733 %   custom_attributes_taskcustomattribute    TABLE     �  CREATE TABLE public.custom_attributes_taskcustomattribute (
    id integer NOT NULL,
    name character varying(64) NOT NULL,
    description text NOT NULL,
    "order" bigint NOT NULL,
    created_date timestamp with time zone NOT NULL,
    modified_date timestamp with time zone NOT NULL,
    project_id integer NOT NULL,
    type character varying(16) NOT NULL,
    extra jsonb
);
 9   DROP TABLE public.custom_attributes_taskcustomattribute;
       public         heap    taiga    false                       1259    9872731 ,   custom_attributes_taskcustomattribute_id_seq    SEQUENCE     �   CREATE SEQUENCE public.custom_attributes_taskcustomattribute_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 C   DROP SEQUENCE public.custom_attributes_taskcustomattribute_id_seq;
       public          taiga    false    284            �           0    0 ,   custom_attributes_taskcustomattribute_id_seq    SEQUENCE OWNED BY     }   ALTER SEQUENCE public.custom_attributes_taskcustomattribute_id_seq OWNED BY public.custom_attributes_taskcustomattribute.id;
          public          taiga    false    283            "           1259    9872792 ,   custom_attributes_taskcustomattributesvalues    TABLE     �   CREATE TABLE public.custom_attributes_taskcustomattributesvalues (
    id integer NOT NULL,
    version integer NOT NULL,
    attributes_values jsonb NOT NULL,
    task_id integer NOT NULL
);
 @   DROP TABLE public.custom_attributes_taskcustomattributesvalues;
       public         heap    taiga    false            !           1259    9872790 3   custom_attributes_taskcustomattributesvalues_id_seq    SEQUENCE     �   CREATE SEQUENCE public.custom_attributes_taskcustomattributesvalues_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 J   DROP SEQUENCE public.custom_attributes_taskcustomattributesvalues_id_seq;
       public          taiga    false    290            �           0    0 3   custom_attributes_taskcustomattributesvalues_id_seq    SEQUENCE OWNED BY     �   ALTER SEQUENCE public.custom_attributes_taskcustomattributesvalues_id_seq OWNED BY public.custom_attributes_taskcustomattributesvalues.id;
          public          taiga    false    289                       1259    9872744 *   custom_attributes_userstorycustomattribute    TABLE     �  CREATE TABLE public.custom_attributes_userstorycustomattribute (
    id integer NOT NULL,
    name character varying(64) NOT NULL,
    description text NOT NULL,
    "order" bigint NOT NULL,
    created_date timestamp with time zone NOT NULL,
    modified_date timestamp with time zone NOT NULL,
    project_id integer NOT NULL,
    type character varying(16) NOT NULL,
    extra jsonb
);
 >   DROP TABLE public.custom_attributes_userstorycustomattribute;
       public         heap    taiga    false                       1259    9872742 1   custom_attributes_userstorycustomattribute_id_seq    SEQUENCE     �   CREATE SEQUENCE public.custom_attributes_userstorycustomattribute_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 H   DROP SEQUENCE public.custom_attributes_userstorycustomattribute_id_seq;
       public          taiga    false    286            �           0    0 1   custom_attributes_userstorycustomattribute_id_seq    SEQUENCE OWNED BY     �   ALTER SEQUENCE public.custom_attributes_userstorycustomattribute_id_seq OWNED BY public.custom_attributes_userstorycustomattribute.id;
          public          taiga    false    285            $           1259    9872805 1   custom_attributes_userstorycustomattributesvalues    TABLE     �   CREATE TABLE public.custom_attributes_userstorycustomattributesvalues (
    id integer NOT NULL,
    version integer NOT NULL,
    attributes_values jsonb NOT NULL,
    user_story_id integer NOT NULL
);
 E   DROP TABLE public.custom_attributes_userstorycustomattributesvalues;
       public         heap    taiga    false            #           1259    9872803 8   custom_attributes_userstorycustomattributesvalues_id_seq    SEQUENCE     �   CREATE SEQUENCE public.custom_attributes_userstorycustomattributesvalues_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 O   DROP SEQUENCE public.custom_attributes_userstorycustomattributesvalues_id_seq;
       public          taiga    false    292            �           0    0 8   custom_attributes_userstorycustomattributesvalues_id_seq    SEQUENCE OWNED BY     �   ALTER SEQUENCE public.custom_attributes_userstorycustomattributesvalues_id_seq OWNED BY public.custom_attributes_userstorycustomattributesvalues.id;
          public          taiga    false    291            �            1259    9871309    django_admin_log    TABLE     �  CREATE TABLE public.django_admin_log (
    id integer NOT NULL,
    action_time timestamp with time zone NOT NULL,
    object_id text,
    object_repr character varying(200) NOT NULL,
    action_flag smallint NOT NULL,
    change_message text NOT NULL,
    content_type_id integer,
    user_id integer NOT NULL,
    CONSTRAINT django_admin_log_action_flag_check CHECK ((action_flag >= 0))
);
 $   DROP TABLE public.django_admin_log;
       public         heap    taiga    false            �            1259    9871307    django_admin_log_id_seq    SEQUENCE     �   CREATE SEQUENCE public.django_admin_log_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 .   DROP SEQUENCE public.django_admin_log_id_seq;
       public          taiga    false    209            �           0    0    django_admin_log_id_seq    SEQUENCE OWNED BY     S   ALTER SEQUENCE public.django_admin_log_id_seq OWNED BY public.django_admin_log.id;
          public          taiga    false    208            �            1259    9871285    django_content_type    TABLE     �   CREATE TABLE public.django_content_type (
    id integer NOT NULL,
    app_label character varying(100) NOT NULL,
    model character varying(100) NOT NULL
);
 '   DROP TABLE public.django_content_type;
       public         heap    taiga    false            �            1259    9871283    django_content_type_id_seq    SEQUENCE     �   CREATE SEQUENCE public.django_content_type_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 1   DROP SEQUENCE public.django_content_type_id_seq;
       public          taiga    false    205            �           0    0    django_content_type_id_seq    SEQUENCE OWNED BY     Y   ALTER SEQUENCE public.django_content_type_id_seq OWNED BY public.django_content_type.id;
          public          taiga    false    204            �            1259    9871274    django_migrations    TABLE     �   CREATE TABLE public.django_migrations (
    id integer NOT NULL,
    app character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    applied timestamp with time zone NOT NULL
);
 %   DROP TABLE public.django_migrations;
       public         heap    taiga    false            �            1259    9871272    django_migrations_id_seq    SEQUENCE     �   CREATE SEQUENCE public.django_migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 /   DROP SEQUENCE public.django_migrations_id_seq;
       public          taiga    false    203            �           0    0    django_migrations_id_seq    SEQUENCE OWNED BY     U   ALTER SEQUENCE public.django_migrations_id_seq OWNED BY public.django_migrations.id;
          public          taiga    false    202            E           1259    9873314    django_session    TABLE     �   CREATE TABLE public.django_session (
    session_key character varying(40) NOT NULL,
    session_data text NOT NULL,
    expire_date timestamp with time zone NOT NULL
);
 "   DROP TABLE public.django_session;
       public         heap    taiga    false            )           1259    9872957    djmail_message    TABLE     �  CREATE TABLE public.djmail_message (
    uuid character varying(40) NOT NULL,
    from_email character varying(1024) NOT NULL,
    to_email text NOT NULL,
    body_text text NOT NULL,
    body_html text NOT NULL,
    subject character varying(1024) NOT NULL,
    data text NOT NULL,
    retry_count smallint NOT NULL,
    status smallint NOT NULL,
    priority smallint NOT NULL,
    created_at timestamp with time zone NOT NULL,
    sent_at timestamp with time zone,
    exception text NOT NULL
);
 "   DROP TABLE public.djmail_message;
       public         heap    taiga    false            +           1259    9872968    easy_thumbnails_source    TABLE     �   CREATE TABLE public.easy_thumbnails_source (
    id integer NOT NULL,
    storage_hash character varying(40) NOT NULL,
    name character varying(255) NOT NULL,
    modified timestamp with time zone NOT NULL
);
 *   DROP TABLE public.easy_thumbnails_source;
       public         heap    taiga    false            *           1259    9872966    easy_thumbnails_source_id_seq    SEQUENCE     �   CREATE SEQUENCE public.easy_thumbnails_source_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 4   DROP SEQUENCE public.easy_thumbnails_source_id_seq;
       public          taiga    false    299            �           0    0    easy_thumbnails_source_id_seq    SEQUENCE OWNED BY     _   ALTER SEQUENCE public.easy_thumbnails_source_id_seq OWNED BY public.easy_thumbnails_source.id;
          public          taiga    false    298            -           1259    9872976    easy_thumbnails_thumbnail    TABLE     �   CREATE TABLE public.easy_thumbnails_thumbnail (
    id integer NOT NULL,
    storage_hash character varying(40) NOT NULL,
    name character varying(255) NOT NULL,
    modified timestamp with time zone NOT NULL,
    source_id integer NOT NULL
);
 -   DROP TABLE public.easy_thumbnails_thumbnail;
       public         heap    taiga    false            ,           1259    9872974     easy_thumbnails_thumbnail_id_seq    SEQUENCE     �   CREATE SEQUENCE public.easy_thumbnails_thumbnail_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 7   DROP SEQUENCE public.easy_thumbnails_thumbnail_id_seq;
       public          taiga    false    301            �           0    0     easy_thumbnails_thumbnail_id_seq    SEQUENCE OWNED BY     e   ALTER SEQUENCE public.easy_thumbnails_thumbnail_id_seq OWNED BY public.easy_thumbnails_thumbnail.id;
          public          taiga    false    300            /           1259    9873002 #   easy_thumbnails_thumbnaildimensions    TABLE     K  CREATE TABLE public.easy_thumbnails_thumbnaildimensions (
    id integer NOT NULL,
    thumbnail_id integer NOT NULL,
    width integer,
    height integer,
    CONSTRAINT easy_thumbnails_thumbnaildimensions_height_check CHECK ((height >= 0)),
    CONSTRAINT easy_thumbnails_thumbnaildimensions_width_check CHECK ((width >= 0))
);
 7   DROP TABLE public.easy_thumbnails_thumbnaildimensions;
       public         heap    taiga    false            .           1259    9873000 *   easy_thumbnails_thumbnaildimensions_id_seq    SEQUENCE     �   CREATE SEQUENCE public.easy_thumbnails_thumbnaildimensions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 A   DROP SEQUENCE public.easy_thumbnails_thumbnaildimensions_id_seq;
       public          taiga    false    303            �           0    0 *   easy_thumbnails_thumbnaildimensions_id_seq    SEQUENCE OWNED BY     y   ALTER SEQUENCE public.easy_thumbnails_thumbnaildimensions_id_seq OWNED BY public.easy_thumbnails_thumbnaildimensions.id;
          public          taiga    false    302                       1259    9872663 
   epics_epic    TABLE     �  CREATE TABLE public.epics_epic (
    id integer NOT NULL,
    tags text[],
    version integer NOT NULL,
    is_blocked boolean NOT NULL,
    blocked_note text NOT NULL,
    ref bigint,
    epics_order bigint NOT NULL,
    created_date timestamp with time zone NOT NULL,
    modified_date timestamp with time zone NOT NULL,
    subject text NOT NULL,
    description text NOT NULL,
    client_requirement boolean NOT NULL,
    team_requirement boolean NOT NULL,
    assigned_to_id integer,
    owner_id integer,
    project_id integer NOT NULL,
    status_id integer,
    color character varying(32) NOT NULL,
    external_reference text[]
);
    DROP TABLE public.epics_epic;
       public         heap    taiga    false                       1259    9872661    epics_epic_id_seq    SEQUENCE     �   CREATE SEQUENCE public.epics_epic_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 (   DROP SEQUENCE public.epics_epic_id_seq;
       public          taiga    false    278            �           0    0    epics_epic_id_seq    SEQUENCE OWNED BY     G   ALTER SEQUENCE public.epics_epic_id_seq OWNED BY public.epics_epic.id;
          public          taiga    false    277                       1259    9872674    epics_relateduserstory    TABLE     �   CREATE TABLE public.epics_relateduserstory (
    id integer NOT NULL,
    "order" bigint NOT NULL,
    epic_id integer NOT NULL,
    user_story_id integer NOT NULL
);
 *   DROP TABLE public.epics_relateduserstory;
       public         heap    taiga    false                       1259    9872672    epics_relateduserstory_id_seq    SEQUENCE     �   CREATE SEQUENCE public.epics_relateduserstory_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 4   DROP SEQUENCE public.epics_relateduserstory_id_seq;
       public          taiga    false    280            �           0    0    epics_relateduserstory_id_seq    SEQUENCE OWNED BY     _   ALTER SEQUENCE public.epics_relateduserstory_id_seq OWNED BY public.epics_relateduserstory.id;
          public          taiga    false    279            0           1259    9873043    external_apps_application    TABLE     �   CREATE TABLE public.external_apps_application (
    id character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    icon_url text,
    web character varying(255),
    description text,
    next_url text NOT NULL
);
 -   DROP TABLE public.external_apps_application;
       public         heap    taiga    false            2           1259    9873053    external_apps_applicationtoken    TABLE       CREATE TABLE public.external_apps_applicationtoken (
    id integer NOT NULL,
    auth_code character varying(255),
    token character varying(255),
    state character varying(255),
    application_id character varying(255) NOT NULL,
    user_id integer NOT NULL
);
 2   DROP TABLE public.external_apps_applicationtoken;
       public         heap    taiga    false            1           1259    9873051 %   external_apps_applicationtoken_id_seq    SEQUENCE     �   CREATE SEQUENCE public.external_apps_applicationtoken_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 <   DROP SEQUENCE public.external_apps_applicationtoken_id_seq;
       public          taiga    false    306            �           0    0 %   external_apps_applicationtoken_id_seq    SEQUENCE OWNED BY     o   ALTER SEQUENCE public.external_apps_applicationtoken_id_seq OWNED BY public.external_apps_applicationtoken.id;
          public          taiga    false    305            4           1259    9873080    feedback_feedbackentry    TABLE     �   CREATE TABLE public.feedback_feedbackentry (
    id integer NOT NULL,
    full_name character varying(256) NOT NULL,
    email character varying(255) NOT NULL,
    comment text NOT NULL,
    created_date timestamp with time zone NOT NULL
);
 *   DROP TABLE public.feedback_feedbackentry;
       public         heap    taiga    false            3           1259    9873078    feedback_feedbackentry_id_seq    SEQUENCE     �   CREATE SEQUENCE public.feedback_feedbackentry_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 4   DROP SEQUENCE public.feedback_feedbackentry_id_seq;
       public          taiga    false    308            �           0    0    feedback_feedbackentry_id_seq    SEQUENCE OWNED BY     _   ALTER SEQUENCE public.feedback_feedbackentry_id_seq OWNED BY public.feedback_feedbackentry.id;
          public          taiga    false    307                       1259    9872625    history_historyentry    TABLE     /  CREATE TABLE public.history_historyentry (
    id character varying(255) NOT NULL,
    "user" jsonb,
    created_at timestamp with time zone,
    type smallint,
    is_snapshot boolean,
    key character varying(255),
    diff jsonb,
    snapshot jsonb,
    "values" jsonb,
    comment text,
    comment_html text,
    delete_comment_date timestamp with time zone,
    delete_comment_user jsonb,
    is_hidden boolean,
    comment_versions jsonb,
    edit_comment_date timestamp with time zone,
    project_id integer NOT NULL,
    values_diff_cache jsonb
);
 (   DROP TABLE public.history_historyentry;
       public         heap    taiga    false            �            1259    9871738    issues_issue    TABLE     �  CREATE TABLE public.issues_issue (
    id integer NOT NULL,
    tags text[],
    version integer NOT NULL,
    is_blocked boolean NOT NULL,
    blocked_note text NOT NULL,
    ref bigint,
    created_date timestamp with time zone NOT NULL,
    modified_date timestamp with time zone NOT NULL,
    finished_date timestamp with time zone,
    subject text NOT NULL,
    description text NOT NULL,
    assigned_to_id integer,
    milestone_id integer,
    owner_id integer,
    priority_id integer,
    project_id integer NOT NULL,
    severity_id integer,
    status_id integer,
    type_id integer,
    external_reference text[],
    due_date date,
    due_date_reason text NOT NULL
);
     DROP TABLE public.issues_issue;
       public         heap    taiga    false            �            1259    9871736    issues_issue_id_seq    SEQUENCE     �   CREATE SEQUENCE public.issues_issue_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 *   DROP SEQUENCE public.issues_issue_id_seq;
       public          taiga    false    243            �           0    0    issues_issue_id_seq    SEQUENCE OWNED BY     K   ALTER SEQUENCE public.issues_issue_id_seq OWNED BY public.issues_issue.id;
          public          taiga    false    242                       1259    9872325 
   likes_like    TABLE       CREATE TABLE public.likes_like (
    id integer NOT NULL,
    object_id integer NOT NULL,
    created_date timestamp with time zone NOT NULL,
    content_type_id integer NOT NULL,
    user_id integer NOT NULL,
    CONSTRAINT likes_like_object_id_check CHECK ((object_id >= 0))
);
    DROP TABLE public.likes_like;
       public         heap    taiga    false            
           1259    9872323    likes_like_id_seq    SEQUENCE     �   CREATE SEQUENCE public.likes_like_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 (   DROP SEQUENCE public.likes_like_id_seq;
       public          taiga    false    267            �           0    0    likes_like_id_seq    SEQUENCE OWNED BY     G   ALTER SEQUENCE public.likes_like_id_seq OWNED BY public.likes_like.id;
          public          taiga    false    266            �            1259    9871687    milestones_milestone    TABLE     )  CREATE TABLE public.milestones_milestone (
    id integer NOT NULL,
    name character varying(200) NOT NULL,
    slug character varying(250) NOT NULL,
    estimated_start date NOT NULL,
    estimated_finish date NOT NULL,
    created_date timestamp with time zone NOT NULL,
    modified_date timestamp with time zone NOT NULL,
    closed boolean NOT NULL,
    disponibility double precision,
    "order" smallint NOT NULL,
    owner_id integer,
    project_id integer NOT NULL,
    CONSTRAINT milestones_milestone_order_check CHECK (("order" >= 0))
);
 (   DROP TABLE public.milestones_milestone;
       public         heap    taiga    false            �            1259    9871685    milestones_milestone_id_seq    SEQUENCE     �   CREATE SEQUENCE public.milestones_milestone_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 2   DROP SEQUENCE public.milestones_milestone_id_seq;
       public          taiga    false    241            �           0    0    milestones_milestone_id_seq    SEQUENCE OWNED BY     [   ALTER SEQUENCE public.milestones_milestone_id_seq OWNED BY public.milestones_milestone.id;
          public          taiga    false    240            �            1259    9871998 '   notifications_historychangenotification    TABLE     V  CREATE TABLE public.notifications_historychangenotification (
    id integer NOT NULL,
    key character varying(255) NOT NULL,
    created_datetime timestamp with time zone NOT NULL,
    updated_datetime timestamp with time zone NOT NULL,
    history_type smallint NOT NULL,
    owner_id integer NOT NULL,
    project_id integer NOT NULL
);
 ;   DROP TABLE public.notifications_historychangenotification;
       public         heap    taiga    false            �            1259    9872006 7   notifications_historychangenotification_history_entries    TABLE     �   CREATE TABLE public.notifications_historychangenotification_history_entries (
    id integer NOT NULL,
    historychangenotification_id integer NOT NULL,
    historyentry_id character varying(255) NOT NULL
);
 K   DROP TABLE public.notifications_historychangenotification_history_entries;
       public         heap    taiga    false            �            1259    9872004 >   notifications_historychangenotification_history_entries_id_seq    SEQUENCE     �   CREATE SEQUENCE public.notifications_historychangenotification_history_entries_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 U   DROP SEQUENCE public.notifications_historychangenotification_history_entries_id_seq;
       public          taiga    false    253            �           0    0 >   notifications_historychangenotification_history_entries_id_seq    SEQUENCE OWNED BY     �   ALTER SEQUENCE public.notifications_historychangenotification_history_entries_id_seq OWNED BY public.notifications_historychangenotification_history_entries.id;
          public          taiga    false    252            �            1259    9871996 .   notifications_historychangenotification_id_seq    SEQUENCE     �   CREATE SEQUENCE public.notifications_historychangenotification_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 E   DROP SEQUENCE public.notifications_historychangenotification_id_seq;
       public          taiga    false    251            �           0    0 .   notifications_historychangenotification_id_seq    SEQUENCE OWNED BY     �   ALTER SEQUENCE public.notifications_historychangenotification_id_seq OWNED BY public.notifications_historychangenotification.id;
          public          taiga    false    250            �            1259    9872014 4   notifications_historychangenotification_notify_users    TABLE     �   CREATE TABLE public.notifications_historychangenotification_notify_users (
    id integer NOT NULL,
    historychangenotification_id integer NOT NULL,
    user_id integer NOT NULL
);
 H   DROP TABLE public.notifications_historychangenotification_notify_users;
       public         heap    taiga    false            �            1259    9872012 ;   notifications_historychangenotification_notify_users_id_seq    SEQUENCE     �   CREATE SEQUENCE public.notifications_historychangenotification_notify_users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 R   DROP SEQUENCE public.notifications_historychangenotification_notify_users_id_seq;
       public          taiga    false    255            �           0    0 ;   notifications_historychangenotification_notify_users_id_seq    SEQUENCE OWNED BY     �   ALTER SEQUENCE public.notifications_historychangenotification_notify_users_id_seq OWNED BY public.notifications_historychangenotification_notify_users.id;
          public          taiga    false    254            �            1259    9871955    notifications_notifypolicy    TABLE     d  CREATE TABLE public.notifications_notifypolicy (
    id integer NOT NULL,
    notify_level smallint NOT NULL,
    created_at timestamp with time zone NOT NULL,
    modified_at timestamp with time zone NOT NULL,
    project_id integer NOT NULL,
    user_id integer NOT NULL,
    live_notify_level smallint NOT NULL,
    web_notify_level boolean NOT NULL
);
 .   DROP TABLE public.notifications_notifypolicy;
       public         heap    taiga    false            �            1259    9871953 !   notifications_notifypolicy_id_seq    SEQUENCE     �   CREATE SEQUENCE public.notifications_notifypolicy_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 8   DROP SEQUENCE public.notifications_notifypolicy_id_seq;
       public          taiga    false    249            �           0    0 !   notifications_notifypolicy_id_seq    SEQUENCE OWNED BY     g   ALTER SEQUENCE public.notifications_notifypolicy_id_seq OWNED BY public.notifications_notifypolicy.id;
          public          taiga    false    248                       1259    9872065    notifications_watched    TABLE     O  CREATE TABLE public.notifications_watched (
    id integer NOT NULL,
    object_id integer NOT NULL,
    created_date timestamp with time zone NOT NULL,
    content_type_id integer NOT NULL,
    user_id integer NOT NULL,
    project_id integer NOT NULL,
    CONSTRAINT notifications_watched_object_id_check CHECK ((object_id >= 0))
);
 )   DROP TABLE public.notifications_watched;
       public         heap    taiga    false                        1259    9872063    notifications_watched_id_seq    SEQUENCE     �   CREATE SEQUENCE public.notifications_watched_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 3   DROP SEQUENCE public.notifications_watched_id_seq;
       public          taiga    false    257            �           0    0    notifications_watched_id_seq    SEQUENCE OWNED BY     ]   ALTER SEQUENCE public.notifications_watched_id_seq OWNED BY public.notifications_watched.id;
          public          taiga    false    256            6           1259    9873139    notifications_webnotification    TABLE     R  CREATE TABLE public.notifications_webnotification (
    id integer NOT NULL,
    created timestamp with time zone NOT NULL,
    read timestamp with time zone,
    event_type integer NOT NULL,
    data jsonb NOT NULL,
    user_id integer NOT NULL,
    CONSTRAINT notifications_webnotification_event_type_check CHECK ((event_type >= 0))
);
 1   DROP TABLE public.notifications_webnotification;
       public         heap    taiga    false            5           1259    9873137 $   notifications_webnotification_id_seq    SEQUENCE     �   CREATE SEQUENCE public.notifications_webnotification_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 ;   DROP SEQUENCE public.notifications_webnotification_id_seq;
       public          taiga    false    310            �           0    0 $   notifications_webnotification_id_seq    SEQUENCE OWNED BY     m   ALTER SEQUENCE public.notifications_webnotification_id_seq OWNED BY public.notifications_webnotification.id;
          public          taiga    false    309                       1259    9872432    projects_epicstatus    TABLE     "  CREATE TABLE public.projects_epicstatus (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    slug character varying(255) NOT NULL,
    "order" integer NOT NULL,
    is_closed boolean NOT NULL,
    color character varying(20) NOT NULL,
    project_id integer NOT NULL
);
 '   DROP TABLE public.projects_epicstatus;
       public         heap    taiga    false                       1259    9872430    projects_epicstatus_id_seq    SEQUENCE     �   CREATE SEQUENCE public.projects_epicstatus_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 1   DROP SEQUENCE public.projects_epicstatus_id_seq;
       public          taiga    false    269            �           0    0    projects_epicstatus_id_seq    SEQUENCE OWNED BY     Y   ALTER SEQUENCE public.projects_epicstatus_id_seq OWNED BY public.projects_epicstatus.id;
          public          taiga    false    268            :           1259    9873182    projects_issueduedate    TABLE       CREATE TABLE public.projects_issueduedate (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    "order" integer NOT NULL,
    by_default boolean NOT NULL,
    color character varying(20) NOT NULL,
    days_to_due integer,
    project_id integer NOT NULL
);
 )   DROP TABLE public.projects_issueduedate;
       public         heap    taiga    false            9           1259    9873180    projects_issueduedate_id_seq    SEQUENCE     �   CREATE SEQUENCE public.projects_issueduedate_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 3   DROP SEQUENCE public.projects_issueduedate_id_seq;
       public          taiga    false    314            �           0    0    projects_issueduedate_id_seq    SEQUENCE OWNED BY     ]   ALTER SEQUENCE public.projects_issueduedate_id_seq OWNED BY public.projects_issueduedate.id;
          public          taiga    false    313            �            1259    9871399    projects_issuestatus    TABLE     #  CREATE TABLE public.projects_issuestatus (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    "order" integer NOT NULL,
    is_closed boolean NOT NULL,
    color character varying(20) NOT NULL,
    project_id integer NOT NULL,
    slug character varying(255) NOT NULL
);
 (   DROP TABLE public.projects_issuestatus;
       public         heap    taiga    false            �            1259    9871397    projects_issuestatus_id_seq    SEQUENCE     �   CREATE SEQUENCE public.projects_issuestatus_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 2   DROP SEQUENCE public.projects_issuestatus_id_seq;
       public          taiga    false    217            �           0    0    projects_issuestatus_id_seq    SEQUENCE OWNED BY     [   ALTER SEQUENCE public.projects_issuestatus_id_seq OWNED BY public.projects_issuestatus.id;
          public          taiga    false    216            �            1259    9871407    projects_issuetype    TABLE     �   CREATE TABLE public.projects_issuetype (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    "order" integer NOT NULL,
    color character varying(20) NOT NULL,
    project_id integer NOT NULL
);
 &   DROP TABLE public.projects_issuetype;
       public         heap    taiga    false            �            1259    9871405    projects_issuetype_id_seq    SEQUENCE     �   CREATE SEQUENCE public.projects_issuetype_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 0   DROP SEQUENCE public.projects_issuetype_id_seq;
       public          taiga    false    219            �           0    0    projects_issuetype_id_seq    SEQUENCE OWNED BY     W   ALTER SEQUENCE public.projects_issuetype_id_seq OWNED BY public.projects_issuetype.id;
          public          taiga    false    218            �            1259    9871346    projects_membership    TABLE     �  CREATE TABLE public.projects_membership (
    id integer NOT NULL,
    is_admin boolean NOT NULL,
    email character varying(255),
    created_at timestamp with time zone NOT NULL,
    token character varying(60),
    user_id integer,
    project_id integer NOT NULL,
    role_id integer NOT NULL,
    invited_by_id integer,
    invitation_extra_text text,
    user_order bigint NOT NULL
);
 '   DROP TABLE public.projects_membership;
       public         heap    taiga    false            �            1259    9871344    projects_membership_id_seq    SEQUENCE     �   CREATE SEQUENCE public.projects_membership_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 1   DROP SEQUENCE public.projects_membership_id_seq;
       public          taiga    false    213            �           0    0    projects_membership_id_seq    SEQUENCE OWNED BY     Y   ALTER SEQUENCE public.projects_membership_id_seq OWNED BY public.projects_membership.id;
          public          taiga    false    212            �            1259    9871415    projects_points    TABLE     �   CREATE TABLE public.projects_points (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    "order" integer NOT NULL,
    value double precision,
    project_id integer NOT NULL
);
 #   DROP TABLE public.projects_points;
       public         heap    taiga    false            �            1259    9871413    projects_points_id_seq    SEQUENCE     �   CREATE SEQUENCE public.projects_points_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 -   DROP SEQUENCE public.projects_points_id_seq;
       public          taiga    false    221            �           0    0    projects_points_id_seq    SEQUENCE OWNED BY     Q   ALTER SEQUENCE public.projects_points_id_seq OWNED BY public.projects_points.id;
          public          taiga    false    220            �            1259    9871423    projects_priority    TABLE     �   CREATE TABLE public.projects_priority (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    "order" integer NOT NULL,
    color character varying(20) NOT NULL,
    project_id integer NOT NULL
);
 %   DROP TABLE public.projects_priority;
       public         heap    taiga    false            �            1259    9871421    projects_priority_id_seq    SEQUENCE     �   CREATE SEQUENCE public.projects_priority_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 /   DROP SEQUENCE public.projects_priority_id_seq;
       public          taiga    false    223            �           0    0    projects_priority_id_seq    SEQUENCE OWNED BY     U   ALTER SEQUENCE public.projects_priority_id_seq OWNED BY public.projects_priority.id;
          public          taiga    false    222            �            1259    9871354    projects_project    TABLE     ;  CREATE TABLE public.projects_project (
    id integer NOT NULL,
    tags text[],
    name character varying(250) NOT NULL,
    slug character varying(250) NOT NULL,
    description text,
    created_date timestamp with time zone NOT NULL,
    modified_date timestamp with time zone NOT NULL,
    total_milestones integer,
    total_story_points double precision,
    is_backlog_activated boolean NOT NULL,
    is_kanban_activated boolean NOT NULL,
    is_wiki_activated boolean NOT NULL,
    is_issues_activated boolean NOT NULL,
    videoconferences character varying(250),
    videoconferences_extra_data character varying(250),
    anon_permissions text[],
    public_permissions text[],
    is_private boolean NOT NULL,
    tags_colors text[],
    owner_id integer,
    creation_template_id integer,
    default_issue_status_id integer,
    default_issue_type_id integer,
    default_points_id integer,
    default_priority_id integer,
    default_severity_id integer,
    default_task_status_id integer,
    default_us_status_id integer,
    issues_csv_uuid character varying(32),
    tasks_csv_uuid character varying(32),
    userstories_csv_uuid character varying(32),
    is_featured boolean NOT NULL,
    is_looking_for_people boolean NOT NULL,
    total_activity integer NOT NULL,
    total_activity_last_month integer NOT NULL,
    total_activity_last_week integer NOT NULL,
    total_activity_last_year integer NOT NULL,
    total_fans integer NOT NULL,
    total_fans_last_month integer NOT NULL,
    total_fans_last_week integer NOT NULL,
    total_fans_last_year integer NOT NULL,
    totals_updated_datetime timestamp with time zone NOT NULL,
    logo character varying(500),
    looking_for_people_note text NOT NULL,
    blocked_code character varying(255),
    transfer_token character varying(255),
    is_epics_activated boolean NOT NULL,
    default_epic_status_id integer,
    epics_csv_uuid character varying(32),
    is_contact_activated boolean NOT NULL,
    default_swimlane_id integer,
    workspace_id integer,
    color integer NOT NULL,
    workspace_member_permissions text[],
    CONSTRAINT projects_project_total_activity_check CHECK ((total_activity >= 0)),
    CONSTRAINT projects_project_total_activity_last_month_check CHECK ((total_activity_last_month >= 0)),
    CONSTRAINT projects_project_total_activity_last_week_check CHECK ((total_activity_last_week >= 0)),
    CONSTRAINT projects_project_total_activity_last_year_check CHECK ((total_activity_last_year >= 0)),
    CONSTRAINT projects_project_total_fans_check CHECK ((total_fans >= 0)),
    CONSTRAINT projects_project_total_fans_last_month_check CHECK ((total_fans_last_month >= 0)),
    CONSTRAINT projects_project_total_fans_last_week_check CHECK ((total_fans_last_week >= 0)),
    CONSTRAINT projects_project_total_fans_last_year_check CHECK ((total_fans_last_year >= 0))
);
 $   DROP TABLE public.projects_project;
       public         heap    taiga    false            �            1259    9871352    projects_project_id_seq    SEQUENCE     �   CREATE SEQUENCE public.projects_project_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 .   DROP SEQUENCE public.projects_project_id_seq;
       public          taiga    false    215            �           0    0    projects_project_id_seq    SEQUENCE OWNED BY     S   ALTER SEQUENCE public.projects_project_id_seq OWNED BY public.projects_project.id;
          public          taiga    false    214                       1259    9872250    projects_projectmodulesconfig    TABLE     �   CREATE TABLE public.projects_projectmodulesconfig (
    id integer NOT NULL,
    config jsonb,
    project_id integer NOT NULL
);
 1   DROP TABLE public.projects_projectmodulesconfig;
       public         heap    taiga    false                       1259    9872248 $   projects_projectmodulesconfig_id_seq    SEQUENCE     �   CREATE SEQUENCE public.projects_projectmodulesconfig_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 ;   DROP SEQUENCE public.projects_projectmodulesconfig_id_seq;
       public          taiga    false    263            �           0    0 $   projects_projectmodulesconfig_id_seq    SEQUENCE OWNED BY     m   ALTER SEQUENCE public.projects_projectmodulesconfig_id_seq OWNED BY public.projects_projectmodulesconfig.id;
          public          taiga    false    262            �            1259    9871431    projects_projecttemplate    TABLE       CREATE TABLE public.projects_projecttemplate (
    id integer NOT NULL,
    name character varying(250) NOT NULL,
    slug character varying(250) NOT NULL,
    description text NOT NULL,
    created_date timestamp with time zone NOT NULL,
    modified_date timestamp with time zone NOT NULL,
    default_owner_role character varying(50) NOT NULL,
    is_backlog_activated boolean NOT NULL,
    is_kanban_activated boolean NOT NULL,
    is_wiki_activated boolean NOT NULL,
    is_issues_activated boolean NOT NULL,
    videoconferences character varying(250),
    videoconferences_extra_data character varying(250),
    default_options jsonb,
    us_statuses jsonb,
    points jsonb,
    task_statuses jsonb,
    issue_statuses jsonb,
    issue_types jsonb,
    priorities jsonb,
    severities jsonb,
    roles jsonb,
    "order" bigint NOT NULL,
    epic_statuses jsonb,
    is_epics_activated boolean NOT NULL,
    is_contact_activated boolean NOT NULL,
    epic_custom_attributes jsonb,
    is_looking_for_people boolean NOT NULL,
    issue_custom_attributes jsonb,
    looking_for_people_note text NOT NULL,
    tags text[],
    tags_colors text[],
    task_custom_attributes jsonb,
    us_custom_attributes jsonb,
    issue_duedates jsonb,
    task_duedates jsonb,
    us_duedates jsonb
);
 ,   DROP TABLE public.projects_projecttemplate;
       public         heap    taiga    false            �            1259    9871429    projects_projecttemplate_id_seq    SEQUENCE     �   CREATE SEQUENCE public.projects_projecttemplate_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 6   DROP SEQUENCE public.projects_projecttemplate_id_seq;
       public          taiga    false    225            �           0    0    projects_projecttemplate_id_seq    SEQUENCE OWNED BY     c   ALTER SEQUENCE public.projects_projecttemplate_id_seq OWNED BY public.projects_projecttemplate.id;
          public          taiga    false    224            �            1259    9871444    projects_severity    TABLE     �   CREATE TABLE public.projects_severity (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    "order" integer NOT NULL,
    color character varying(20) NOT NULL,
    project_id integer NOT NULL
);
 %   DROP TABLE public.projects_severity;
       public         heap    taiga    false            �            1259    9871442    projects_severity_id_seq    SEQUENCE     �   CREATE SEQUENCE public.projects_severity_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 /   DROP SEQUENCE public.projects_severity_id_seq;
       public          taiga    false    227            �           0    0    projects_severity_id_seq    SEQUENCE OWNED BY     U   ALTER SEQUENCE public.projects_severity_id_seq OWNED BY public.projects_severity.id;
          public          taiga    false    226            @           1259    9873237    projects_swimlane    TABLE     �   CREATE TABLE public.projects_swimlane (
    id integer NOT NULL,
    name text NOT NULL,
    "order" bigint NOT NULL,
    project_id integer NOT NULL
);
 %   DROP TABLE public.projects_swimlane;
       public         heap    taiga    false            ?           1259    9873235    projects_swimlane_id_seq    SEQUENCE     �   CREATE SEQUENCE public.projects_swimlane_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 /   DROP SEQUENCE public.projects_swimlane_id_seq;
       public          taiga    false    320            �           0    0    projects_swimlane_id_seq    SEQUENCE OWNED BY     U   ALTER SEQUENCE public.projects_swimlane_id_seq OWNED BY public.projects_swimlane.id;
          public          taiga    false    319            B           1259    9873254     projects_swimlaneuserstorystatus    TABLE     �   CREATE TABLE public.projects_swimlaneuserstorystatus (
    id integer NOT NULL,
    wip_limit integer,
    status_id integer NOT NULL,
    swimlane_id integer NOT NULL
);
 4   DROP TABLE public.projects_swimlaneuserstorystatus;
       public         heap    taiga    false            A           1259    9873252 '   projects_swimlaneuserstorystatus_id_seq    SEQUENCE     �   CREATE SEQUENCE public.projects_swimlaneuserstorystatus_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 >   DROP SEQUENCE public.projects_swimlaneuserstorystatus_id_seq;
       public          taiga    false    322            �           0    0 '   projects_swimlaneuserstorystatus_id_seq    SEQUENCE OWNED BY     s   ALTER SEQUENCE public.projects_swimlaneuserstorystatus_id_seq OWNED BY public.projects_swimlaneuserstorystatus.id;
          public          taiga    false    321            <           1259    9873190    projects_taskduedate    TABLE       CREATE TABLE public.projects_taskduedate (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    "order" integer NOT NULL,
    by_default boolean NOT NULL,
    color character varying(20) NOT NULL,
    days_to_due integer,
    project_id integer NOT NULL
);
 (   DROP TABLE public.projects_taskduedate;
       public         heap    taiga    false            ;           1259    9873188    projects_taskduedate_id_seq    SEQUENCE     �   CREATE SEQUENCE public.projects_taskduedate_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 2   DROP SEQUENCE public.projects_taskduedate_id_seq;
       public          taiga    false    316            �           0    0    projects_taskduedate_id_seq    SEQUENCE OWNED BY     [   ALTER SEQUENCE public.projects_taskduedate_id_seq OWNED BY public.projects_taskduedate.id;
          public          taiga    false    315            �            1259    9871452    projects_taskstatus    TABLE     "  CREATE TABLE public.projects_taskstatus (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    "order" integer NOT NULL,
    is_closed boolean NOT NULL,
    color character varying(20) NOT NULL,
    project_id integer NOT NULL,
    slug character varying(255) NOT NULL
);
 '   DROP TABLE public.projects_taskstatus;
       public         heap    taiga    false            �            1259    9871450    projects_taskstatus_id_seq    SEQUENCE     �   CREATE SEQUENCE public.projects_taskstatus_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 1   DROP SEQUENCE public.projects_taskstatus_id_seq;
       public          taiga    false    229            �           0    0    projects_taskstatus_id_seq    SEQUENCE OWNED BY     Y   ALTER SEQUENCE public.projects_taskstatus_id_seq OWNED BY public.projects_taskstatus.id;
          public          taiga    false    228            >           1259    9873198    projects_userstoryduedate    TABLE       CREATE TABLE public.projects_userstoryduedate (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    "order" integer NOT NULL,
    by_default boolean NOT NULL,
    color character varying(20) NOT NULL,
    days_to_due integer,
    project_id integer NOT NULL
);
 -   DROP TABLE public.projects_userstoryduedate;
       public         heap    taiga    false            =           1259    9873196     projects_userstoryduedate_id_seq    SEQUENCE     �   CREATE SEQUENCE public.projects_userstoryduedate_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 7   DROP SEQUENCE public.projects_userstoryduedate_id_seq;
       public          taiga    false    318            �           0    0     projects_userstoryduedate_id_seq    SEQUENCE OWNED BY     e   ALTER SEQUENCE public.projects_userstoryduedate_id_seq OWNED BY public.projects_userstoryduedate.id;
          public          taiga    false    317            �            1259    9871460    projects_userstorystatus    TABLE     `  CREATE TABLE public.projects_userstorystatus (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    "order" integer NOT NULL,
    is_closed boolean NOT NULL,
    color character varying(20) NOT NULL,
    wip_limit integer,
    project_id integer NOT NULL,
    slug character varying(255) NOT NULL,
    is_archived boolean NOT NULL
);
 ,   DROP TABLE public.projects_userstorystatus;
       public         heap    taiga    false            �            1259    9871458    projects_userstorystatus_id_seq    SEQUENCE     �   CREATE SEQUENCE public.projects_userstorystatus_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 6   DROP SEQUENCE public.projects_userstorystatus_id_seq;
       public          taiga    false    231            �           0    0    projects_userstorystatus_id_seq    SEQUENCE OWNED BY     c   ALTER SEQUENCE public.projects_userstorystatus_id_seq OWNED BY public.projects_userstorystatus.id;
          public          taiga    false    230            ^           1259    9873740    references_project1    SEQUENCE     |   CREATE SEQUENCE public.references_project1
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 *   DROP SEQUENCE public.references_project1;
       public          taiga    false            g           1259    9873758    references_project10    SEQUENCE     }   CREATE SEQUENCE public.references_project10
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 +   DROP SEQUENCE public.references_project10;
       public          taiga    false            h           1259    9873760    references_project11    SEQUENCE     }   CREATE SEQUENCE public.references_project11
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 +   DROP SEQUENCE public.references_project11;
       public          taiga    false            i           1259    9873762    references_project12    SEQUENCE     }   CREATE SEQUENCE public.references_project12
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 +   DROP SEQUENCE public.references_project12;
       public          taiga    false            j           1259    9873764    references_project13    SEQUENCE     }   CREATE SEQUENCE public.references_project13
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 +   DROP SEQUENCE public.references_project13;
       public          taiga    false            k           1259    9873766    references_project14    SEQUENCE     }   CREATE SEQUENCE public.references_project14
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 +   DROP SEQUENCE public.references_project14;
       public          taiga    false            l           1259    9873768    references_project15    SEQUENCE     }   CREATE SEQUENCE public.references_project15
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 +   DROP SEQUENCE public.references_project15;
       public          taiga    false            m           1259    9873770    references_project16    SEQUENCE     }   CREATE SEQUENCE public.references_project16
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 +   DROP SEQUENCE public.references_project16;
       public          taiga    false            n           1259    9873772    references_project17    SEQUENCE     }   CREATE SEQUENCE public.references_project17
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 +   DROP SEQUENCE public.references_project17;
       public          taiga    false            o           1259    9873774    references_project18    SEQUENCE     }   CREATE SEQUENCE public.references_project18
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 +   DROP SEQUENCE public.references_project18;
       public          taiga    false            p           1259    9873776    references_project19    SEQUENCE     }   CREATE SEQUENCE public.references_project19
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 +   DROP SEQUENCE public.references_project19;
       public          taiga    false            _           1259    9873742    references_project2    SEQUENCE     |   CREATE SEQUENCE public.references_project2
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 *   DROP SEQUENCE public.references_project2;
       public          taiga    false            q           1259    9873778    references_project20    SEQUENCE     }   CREATE SEQUENCE public.references_project20
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 +   DROP SEQUENCE public.references_project20;
       public          taiga    false            r           1259    9873780    references_project21    SEQUENCE     }   CREATE SEQUENCE public.references_project21
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 +   DROP SEQUENCE public.references_project21;
       public          taiga    false            s           1259    9873782    references_project22    SEQUENCE     }   CREATE SEQUENCE public.references_project22
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 +   DROP SEQUENCE public.references_project22;
       public          taiga    false            t           1259    9873784    references_project23    SEQUENCE     }   CREATE SEQUENCE public.references_project23
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 +   DROP SEQUENCE public.references_project23;
       public          taiga    false            u           1259    9873786    references_project24    SEQUENCE     }   CREATE SEQUENCE public.references_project24
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 +   DROP SEQUENCE public.references_project24;
       public          taiga    false            `           1259    9873744    references_project3    SEQUENCE     |   CREATE SEQUENCE public.references_project3
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 *   DROP SEQUENCE public.references_project3;
       public          taiga    false            a           1259    9873746    references_project4    SEQUENCE     |   CREATE SEQUENCE public.references_project4
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 *   DROP SEQUENCE public.references_project4;
       public          taiga    false            b           1259    9873748    references_project5    SEQUENCE     |   CREATE SEQUENCE public.references_project5
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 *   DROP SEQUENCE public.references_project5;
       public          taiga    false            c           1259    9873750    references_project6    SEQUENCE     |   CREATE SEQUENCE public.references_project6
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 *   DROP SEQUENCE public.references_project6;
       public          taiga    false            d           1259    9873752    references_project7    SEQUENCE     |   CREATE SEQUENCE public.references_project7
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 *   DROP SEQUENCE public.references_project7;
       public          taiga    false            e           1259    9873754    references_project8    SEQUENCE     |   CREATE SEQUENCE public.references_project8
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 *   DROP SEQUENCE public.references_project8;
       public          taiga    false            f           1259    9873756    references_project9    SEQUENCE     |   CREATE SEQUENCE public.references_project9
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 *   DROP SEQUENCE public.references_project9;
       public          taiga    false            D           1259    9873293    references_reference    TABLE     F  CREATE TABLE public.references_reference (
    id integer NOT NULL,
    object_id integer NOT NULL,
    ref bigint NOT NULL,
    created_at timestamp with time zone NOT NULL,
    content_type_id integer NOT NULL,
    project_id integer NOT NULL,
    CONSTRAINT references_reference_object_id_check CHECK ((object_id >= 0))
);
 (   DROP TABLE public.references_reference;
       public         heap    taiga    false            C           1259    9873291    references_reference_id_seq    SEQUENCE     �   CREATE SEQUENCE public.references_reference_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 2   DROP SEQUENCE public.references_reference_id_seq;
       public          taiga    false    324            �           0    0    references_reference_id_seq    SEQUENCE OWNED BY     [   ALTER SEQUENCE public.references_reference_id_seq OWNED BY public.references_reference.id;
          public          taiga    false    323            G           1259    9873326    settings_userprojectsettings    TABLE       CREATE TABLE public.settings_userprojectsettings (
    id integer NOT NULL,
    homepage smallint NOT NULL,
    created_at timestamp with time zone NOT NULL,
    modified_at timestamp with time zone NOT NULL,
    project_id integer NOT NULL,
    user_id integer NOT NULL
);
 0   DROP TABLE public.settings_userprojectsettings;
       public         heap    taiga    false            F           1259    9873324 #   settings_userprojectsettings_id_seq    SEQUENCE     �   CREATE SEQUENCE public.settings_userprojectsettings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 :   DROP SEQUENCE public.settings_userprojectsettings_id_seq;
       public          taiga    false    327            �           0    0 #   settings_userprojectsettings_id_seq    SEQUENCE OWNED BY     k   ALTER SEQUENCE public.settings_userprojectsettings_id_seq OWNED BY public.settings_userprojectsettings.id;
          public          taiga    false    326                       1259    9872094 
   tasks_task    TABLE     �  CREATE TABLE public.tasks_task (
    id integer NOT NULL,
    tags text[],
    version integer NOT NULL,
    is_blocked boolean NOT NULL,
    blocked_note text NOT NULL,
    ref bigint,
    created_date timestamp with time zone NOT NULL,
    modified_date timestamp with time zone NOT NULL,
    finished_date timestamp with time zone,
    subject text NOT NULL,
    description text NOT NULL,
    is_iocaine boolean NOT NULL,
    assigned_to_id integer,
    milestone_id integer,
    owner_id integer,
    project_id integer NOT NULL,
    status_id integer,
    user_story_id integer,
    taskboard_order bigint NOT NULL,
    us_order bigint NOT NULL,
    external_reference text[],
    due_date date,
    due_date_reason text NOT NULL
);
    DROP TABLE public.tasks_task;
       public         heap    taiga    false                       1259    9872092    tasks_task_id_seq    SEQUENCE     �   CREATE SEQUENCE public.tasks_task_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 (   DROP SEQUENCE public.tasks_task_id_seq;
       public          taiga    false    259            �           0    0    tasks_task_id_seq    SEQUENCE OWNED BY     G   ALTER SEQUENCE public.tasks_task_id_seq OWNED BY public.tasks_task.id;
          public          taiga    false    258            I           1259    9873382    telemetry_instancetelemetry    TABLE     �   CREATE TABLE public.telemetry_instancetelemetry (
    id integer NOT NULL,
    instance_id character varying(100) NOT NULL,
    created_at timestamp with time zone NOT NULL
);
 /   DROP TABLE public.telemetry_instancetelemetry;
       public         heap    taiga    false            H           1259    9873380 "   telemetry_instancetelemetry_id_seq    SEQUENCE     �   CREATE SEQUENCE public.telemetry_instancetelemetry_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 9   DROP SEQUENCE public.telemetry_instancetelemetry_id_seq;
       public          taiga    false    329            �           0    0 "   telemetry_instancetelemetry_id_seq    SEQUENCE OWNED BY     i   ALTER SEQUENCE public.telemetry_instancetelemetry_id_seq OWNED BY public.telemetry_instancetelemetry.id;
          public          taiga    false    328            	           1259    9872275    timeline_timeline    TABLE     �  CREATE TABLE public.timeline_timeline (
    id integer NOT NULL,
    object_id integer NOT NULL,
    namespace character varying(250) NOT NULL,
    event_type character varying(250) NOT NULL,
    project_id integer,
    data jsonb NOT NULL,
    data_content_type_id integer NOT NULL,
    created timestamp with time zone NOT NULL,
    content_type_id integer NOT NULL,
    CONSTRAINT timeline_timeline_object_id_check CHECK ((object_id >= 0))
);
 %   DROP TABLE public.timeline_timeline;
       public         heap    taiga    false                       1259    9872273    timeline_timeline_id_seq    SEQUENCE     �   CREATE SEQUENCE public.timeline_timeline_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 /   DROP SEQUENCE public.timeline_timeline_id_seq;
       public          taiga    false    265            �           0    0    timeline_timeline_id_seq    SEQUENCE OWNED BY     U   ALTER SEQUENCE public.timeline_timeline_id_seq OWNED BY public.timeline_timeline.id;
          public          taiga    false    264            M           1259    9873423    token_denylist_denylistedtoken    TABLE     �   CREATE TABLE public.token_denylist_denylistedtoken (
    id bigint NOT NULL,
    denylisted_at timestamp with time zone NOT NULL,
    token_id bigint NOT NULL
);
 2   DROP TABLE public.token_denylist_denylistedtoken;
       public         heap    taiga    false            L           1259    9873421 %   token_denylist_denylistedtoken_id_seq    SEQUENCE     �   CREATE SEQUENCE public.token_denylist_denylistedtoken_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 <   DROP SEQUENCE public.token_denylist_denylistedtoken_id_seq;
       public          taiga    false    333            �           0    0 %   token_denylist_denylistedtoken_id_seq    SEQUENCE OWNED BY     o   ALTER SEQUENCE public.token_denylist_denylistedtoken_id_seq OWNED BY public.token_denylist_denylistedtoken.id;
          public          taiga    false    332            K           1259    9873410    token_denylist_outstandingtoken    TABLE       CREATE TABLE public.token_denylist_outstandingtoken (
    id bigint NOT NULL,
    jti character varying(255) NOT NULL,
    token text NOT NULL,
    created_at timestamp with time zone,
    expires_at timestamp with time zone NOT NULL,
    user_id integer
);
 3   DROP TABLE public.token_denylist_outstandingtoken;
       public         heap    taiga    false            J           1259    9873408 &   token_denylist_outstandingtoken_id_seq    SEQUENCE     �   CREATE SEQUENCE public.token_denylist_outstandingtoken_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 =   DROP SEQUENCE public.token_denylist_outstandingtoken_id_seq;
       public          taiga    false    331            �           0    0 &   token_denylist_outstandingtoken_id_seq    SEQUENCE OWNED BY     q   ALTER SEQUENCE public.token_denylist_outstandingtoken_id_seq OWNED BY public.token_denylist_outstandingtoken.id;
          public          taiga    false    330                       1259    9872176    users_authdata    TABLE     �   CREATE TABLE public.users_authdata (
    id integer NOT NULL,
    key character varying(50) NOT NULL,
    value character varying(300) NOT NULL,
    extra jsonb NOT NULL,
    user_id integer NOT NULL
);
 "   DROP TABLE public.users_authdata;
       public         heap    taiga    false                       1259    9872174    users_authdata_id_seq    SEQUENCE     �   CREATE SEQUENCE public.users_authdata_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 ,   DROP SEQUENCE public.users_authdata_id_seq;
       public          taiga    false    261            �           0    0    users_authdata_id_seq    SEQUENCE OWNED BY     O   ALTER SEQUENCE public.users_authdata_id_seq OWNED BY public.users_authdata.id;
          public          taiga    false    260            �            1259    9871333 
   users_role    TABLE       CREATE TABLE public.users_role (
    id integer NOT NULL,
    name character varying(200) NOT NULL,
    slug character varying(250) NOT NULL,
    permissions text[],
    "order" integer NOT NULL,
    computable boolean NOT NULL,
    project_id integer,
    is_admin boolean NOT NULL
);
    DROP TABLE public.users_role;
       public         heap    taiga    false            �            1259    9871331    users_role_id_seq    SEQUENCE     �   CREATE SEQUENCE public.users_role_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 (   DROP SEQUENCE public.users_role_id_seq;
       public          taiga    false    211            �           0    0    users_role_id_seq    SEQUENCE OWNED BY     G   ALTER SEQUENCE public.users_role_id_seq OWNED BY public.users_role.id;
          public          taiga    false    210            �            1259    9871295 
   users_user    TABLE     �  CREATE TABLE public.users_user (
    id integer NOT NULL,
    password character varying(128) NOT NULL,
    last_login timestamp with time zone,
    is_superuser boolean NOT NULL,
    username character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    is_active boolean NOT NULL,
    full_name character varying(256) NOT NULL,
    color character varying(9) NOT NULL,
    bio text NOT NULL,
    photo character varying(500),
    date_joined timestamp with time zone NOT NULL,
    lang character varying(20),
    timezone character varying(20),
    colorize_tags boolean NOT NULL,
    token character varying(200),
    email_token character varying(200),
    new_email character varying(254),
    is_system boolean NOT NULL,
    theme character varying(100),
    max_private_projects integer,
    max_public_projects integer,
    max_memberships_private_projects integer,
    max_memberships_public_projects integer,
    uuid character varying(32) NOT NULL,
    accepted_terms boolean NOT NULL,
    read_new_terms boolean NOT NULL,
    verified_email boolean NOT NULL,
    is_staff boolean NOT NULL,
    date_cancelled timestamp with time zone
);
    DROP TABLE public.users_user;
       public         heap    taiga    false            �            1259    9871293    users_user_id_seq    SEQUENCE     �   CREATE SEQUENCE public.users_user_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 (   DROP SEQUENCE public.users_user_id_seq;
       public          taiga    false    207            �           0    0    users_user_id_seq    SEQUENCE OWNED BY     G   ALTER SEQUENCE public.users_user_id_seq OWNED BY public.users_user.id;
          public          taiga    false    206            O           1259    9873467    users_workspacerole    TABLE       CREATE TABLE public.users_workspacerole (
    id integer NOT NULL,
    name character varying(200) NOT NULL,
    slug character varying(250) NOT NULL,
    permissions text[],
    "order" integer NOT NULL,
    is_admin boolean NOT NULL,
    workspace_id integer NOT NULL
);
 '   DROP TABLE public.users_workspacerole;
       public         heap    taiga    false            N           1259    9873465    users_workspacerole_id_seq    SEQUENCE     �   CREATE SEQUENCE public.users_workspacerole_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 1   DROP SEQUENCE public.users_workspacerole_id_seq;
       public          taiga    false    335            �           0    0    users_workspacerole_id_seq    SEQUENCE OWNED BY     Y   ALTER SEQUENCE public.users_workspacerole_id_seq OWNED BY public.users_workspacerole.id;
          public          taiga    false    334            Q           1259    9873488    userstorage_storageentry    TABLE       CREATE TABLE public.userstorage_storageentry (
    id integer NOT NULL,
    created_date timestamp with time zone NOT NULL,
    modified_date timestamp with time zone NOT NULL,
    key character varying(255) NOT NULL,
    value jsonb,
    owner_id integer NOT NULL
);
 ,   DROP TABLE public.userstorage_storageentry;
       public         heap    taiga    false            P           1259    9873486    userstorage_storageentry_id_seq    SEQUENCE     �   CREATE SEQUENCE public.userstorage_storageentry_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 6   DROP SEQUENCE public.userstorage_storageentry_id_seq;
       public          taiga    false    337            �           0    0    userstorage_storageentry_id_seq    SEQUENCE OWNED BY     c   ALTER SEQUENCE public.userstorage_storageentry_id_seq OWNED BY public.userstorage_storageentry.id;
          public          taiga    false    336            �            1259    9871820    userstories_rolepoints    TABLE     �   CREATE TABLE public.userstories_rolepoints (
    id integer NOT NULL,
    points_id integer,
    role_id integer NOT NULL,
    user_story_id integer NOT NULL
);
 *   DROP TABLE public.userstories_rolepoints;
       public         heap    taiga    false            �            1259    9871818    userstories_rolepoints_id_seq    SEQUENCE     �   CREATE SEQUENCE public.userstories_rolepoints_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 4   DROP SEQUENCE public.userstories_rolepoints_id_seq;
       public          taiga    false    245            �           0    0    userstories_rolepoints_id_seq    SEQUENCE OWNED BY     _   ALTER SEQUENCE public.userstories_rolepoints_id_seq OWNED BY public.userstories_rolepoints.id;
          public          taiga    false    244            �            1259    9871828    userstories_userstory    TABLE     �  CREATE TABLE public.userstories_userstory (
    id integer NOT NULL,
    tags text[],
    version integer NOT NULL,
    is_blocked boolean NOT NULL,
    blocked_note text NOT NULL,
    ref bigint,
    is_closed boolean NOT NULL,
    backlog_order bigint NOT NULL,
    created_date timestamp with time zone NOT NULL,
    modified_date timestamp with time zone NOT NULL,
    finish_date timestamp with time zone,
    subject text NOT NULL,
    description text NOT NULL,
    client_requirement boolean NOT NULL,
    team_requirement boolean NOT NULL,
    assigned_to_id integer,
    generated_from_issue_id integer,
    milestone_id integer,
    owner_id integer,
    project_id integer NOT NULL,
    status_id integer,
    sprint_order bigint NOT NULL,
    kanban_order bigint NOT NULL,
    external_reference text[],
    tribe_gig text,
    due_date date,
    due_date_reason text NOT NULL,
    generated_from_task_id integer,
    from_task_ref text,
    swimlane_id integer
);
 )   DROP TABLE public.userstories_userstory;
       public         heap    taiga    false            S           1259    9873559 $   userstories_userstory_assigned_users    TABLE     �   CREATE TABLE public.userstories_userstory_assigned_users (
    id integer NOT NULL,
    userstory_id integer NOT NULL,
    user_id integer NOT NULL
);
 8   DROP TABLE public.userstories_userstory_assigned_users;
       public         heap    taiga    false            R           1259    9873557 +   userstories_userstory_assigned_users_id_seq    SEQUENCE     �   CREATE SEQUENCE public.userstories_userstory_assigned_users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 B   DROP SEQUENCE public.userstories_userstory_assigned_users_id_seq;
       public          taiga    false    339            �           0    0 +   userstories_userstory_assigned_users_id_seq    SEQUENCE OWNED BY     {   ALTER SEQUENCE public.userstories_userstory_assigned_users_id_seq OWNED BY public.userstories_userstory_assigned_users.id;
          public          taiga    false    338            �            1259    9871826    userstories_userstory_id_seq    SEQUENCE     �   CREATE SEQUENCE public.userstories_userstory_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 3   DROP SEQUENCE public.userstories_userstory_id_seq;
       public          taiga    false    247            �           0    0    userstories_userstory_id_seq    SEQUENCE OWNED BY     ]   ALTER SEQUENCE public.userstories_userstory_id_seq OWNED BY public.userstories_userstory.id;
          public          taiga    false    246            U           1259    9873598 
   votes_vote    TABLE       CREATE TABLE public.votes_vote (
    id integer NOT NULL,
    object_id integer NOT NULL,
    content_type_id integer NOT NULL,
    user_id integer NOT NULL,
    created_date timestamp with time zone NOT NULL,
    CONSTRAINT votes_vote_object_id_check CHECK ((object_id >= 0))
);
    DROP TABLE public.votes_vote;
       public         heap    taiga    false            T           1259    9873596    votes_vote_id_seq    SEQUENCE     �   CREATE SEQUENCE public.votes_vote_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 (   DROP SEQUENCE public.votes_vote_id_seq;
       public          taiga    false    341            �           0    0    votes_vote_id_seq    SEQUENCE OWNED BY     G   ALTER SEQUENCE public.votes_vote_id_seq OWNED BY public.votes_vote.id;
          public          taiga    false    340            W           1259    9873607    votes_votes    TABLE     !  CREATE TABLE public.votes_votes (
    id integer NOT NULL,
    object_id integer NOT NULL,
    count integer NOT NULL,
    content_type_id integer NOT NULL,
    CONSTRAINT votes_votes_count_check CHECK ((count >= 0)),
    CONSTRAINT votes_votes_object_id_check CHECK ((object_id >= 0))
);
    DROP TABLE public.votes_votes;
       public         heap    taiga    false            V           1259    9873605    votes_votes_id_seq    SEQUENCE     �   CREATE SEQUENCE public.votes_votes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 )   DROP SEQUENCE public.votes_votes_id_seq;
       public          taiga    false    343            �           0    0    votes_votes_id_seq    SEQUENCE OWNED BY     I   ALTER SEQUENCE public.votes_votes_id_seq OWNED BY public.votes_votes.id;
          public          taiga    false    342            Y           1259    9873645    webhooks_webhook    TABLE     �   CREATE TABLE public.webhooks_webhook (
    id integer NOT NULL,
    url character varying(200) NOT NULL,
    key text NOT NULL,
    project_id integer NOT NULL,
    name character varying(250) NOT NULL
);
 $   DROP TABLE public.webhooks_webhook;
       public         heap    taiga    false            X           1259    9873643    webhooks_webhook_id_seq    SEQUENCE     �   CREATE SEQUENCE public.webhooks_webhook_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 .   DROP SEQUENCE public.webhooks_webhook_id_seq;
       public          taiga    false    345            �           0    0    webhooks_webhook_id_seq    SEQUENCE OWNED BY     S   ALTER SEQUENCE public.webhooks_webhook_id_seq OWNED BY public.webhooks_webhook.id;
          public          taiga    false    344            [           1259    9873656    webhooks_webhooklog    TABLE     �  CREATE TABLE public.webhooks_webhooklog (
    id integer NOT NULL,
    url character varying(200) NOT NULL,
    status integer NOT NULL,
    request_data jsonb NOT NULL,
    response_data text NOT NULL,
    webhook_id integer NOT NULL,
    created timestamp with time zone NOT NULL,
    duration double precision NOT NULL,
    request_headers jsonb NOT NULL,
    response_headers jsonb NOT NULL
);
 '   DROP TABLE public.webhooks_webhooklog;
       public         heap    taiga    false            Z           1259    9873654    webhooks_webhooklog_id_seq    SEQUENCE     �   CREATE SEQUENCE public.webhooks_webhooklog_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 1   DROP SEQUENCE public.webhooks_webhooklog_id_seq;
       public          taiga    false    347            �           0    0    webhooks_webhooklog_id_seq    SEQUENCE OWNED BY     Y   ALTER SEQUENCE public.webhooks_webhooklog_id_seq OWNED BY public.webhooks_webhooklog.id;
          public          taiga    false    346                       1259    9872534    wiki_wikilink    TABLE     �   CREATE TABLE public.wiki_wikilink (
    id integer NOT NULL,
    title character varying(500) NOT NULL,
    href character varying(500) NOT NULL,
    "order" bigint NOT NULL,
    project_id integer NOT NULL
);
 !   DROP TABLE public.wiki_wikilink;
       public         heap    taiga    false                       1259    9872532    wiki_wikilink_id_seq    SEQUENCE     �   CREATE SEQUENCE public.wiki_wikilink_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 +   DROP SEQUENCE public.wiki_wikilink_id_seq;
       public          taiga    false    273            �           0    0    wiki_wikilink_id_seq    SEQUENCE OWNED BY     M   ALTER SEQUENCE public.wiki_wikilink_id_seq OWNED BY public.wiki_wikilink.id;
          public          taiga    false    272                       1259    9872546    wiki_wikipage    TABLE     `  CREATE TABLE public.wiki_wikipage (
    id integer NOT NULL,
    version integer NOT NULL,
    slug character varying(500) NOT NULL,
    content text NOT NULL,
    created_date timestamp with time zone NOT NULL,
    modified_date timestamp with time zone NOT NULL,
    last_modifier_id integer,
    owner_id integer,
    project_id integer NOT NULL
);
 !   DROP TABLE public.wiki_wikipage;
       public         heap    taiga    false                       1259    9872544    wiki_wikipage_id_seq    SEQUENCE     �   CREATE SEQUENCE public.wiki_wikipage_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 +   DROP SEQUENCE public.wiki_wikipage_id_seq;
       public          taiga    false    275            �           0    0    wiki_wikipage_id_seq    SEQUENCE OWNED BY     M   ALTER SEQUENCE public.wiki_wikipage_id_seq OWNED BY public.wiki_wikipage.id;
          public          taiga    false    274            8           1259    9873159    workspaces_workspace    TABLE     U  CREATE TABLE public.workspaces_workspace (
    id integer NOT NULL,
    name character varying(40) NOT NULL,
    slug character varying(250),
    color integer NOT NULL,
    created_date timestamp with time zone NOT NULL,
    modified_date timestamp with time zone NOT NULL,
    owner_id integer NOT NULL,
    is_premium boolean NOT NULL
);
 (   DROP TABLE public.workspaces_workspace;
       public         heap    taiga    false            7           1259    9873157    workspaces_workspace_id_seq    SEQUENCE     �   CREATE SEQUENCE public.workspaces_workspace_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 2   DROP SEQUENCE public.workspaces_workspace_id_seq;
       public          taiga    false    312            �           0    0    workspaces_workspace_id_seq    SEQUENCE OWNED BY     [   ALTER SEQUENCE public.workspaces_workspace_id_seq OWNED BY public.workspaces_workspace.id;
          public          taiga    false    311            ]           1259    9873703    workspaces_workspacemembership    TABLE     �   CREATE TABLE public.workspaces_workspacemembership (
    id integer NOT NULL,
    user_id integer,
    workspace_id integer NOT NULL,
    workspace_role_id integer NOT NULL
);
 2   DROP TABLE public.workspaces_workspacemembership;
       public         heap    taiga    false            \           1259    9873701 %   workspaces_workspacemembership_id_seq    SEQUENCE     �   CREATE SEQUENCE public.workspaces_workspacemembership_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 <   DROP SEQUENCE public.workspaces_workspacemembership_id_seq;
       public          taiga    false    349            �           0    0 %   workspaces_workspacemembership_id_seq    SEQUENCE OWNED BY     o   ALTER SEQUENCE public.workspaces_workspacemembership_id_seq OWNED BY public.workspaces_workspacemembership.id;
          public          taiga    false    348            �           2604    9871583    attachments_attachment id    DEFAULT     �   ALTER TABLE ONLY public.attachments_attachment ALTER COLUMN id SET DEFAULT nextval('public.attachments_attachment_id_seq'::regclass);
 H   ALTER TABLE public.attachments_attachment ALTER COLUMN id DROP DEFAULT;
       public          taiga    false    233    232    233            �           2604    9871630    auth_group id    DEFAULT     n   ALTER TABLE ONLY public.auth_group ALTER COLUMN id SET DEFAULT nextval('public.auth_group_id_seq'::regclass);
 <   ALTER TABLE public.auth_group ALTER COLUMN id DROP DEFAULT;
       public          taiga    false    236    237    237            �           2604    9871640    auth_group_permissions id    DEFAULT     �   ALTER TABLE ONLY public.auth_group_permissions ALTER COLUMN id SET DEFAULT nextval('public.auth_group_permissions_id_seq'::regclass);
 H   ALTER TABLE public.auth_group_permissions ALTER COLUMN id DROP DEFAULT;
       public          taiga    false    239    238    239            �           2604    9871622    auth_permission id    DEFAULT     x   ALTER TABLE ONLY public.auth_permission ALTER COLUMN id SET DEFAULT nextval('public.auth_permission_id_seq'::regclass);
 A   ALTER TABLE public.auth_permission ALTER COLUMN id DROP DEFAULT;
       public          taiga    false    234    235    235            �           2604    9872514    contact_contactentry id    DEFAULT     �   ALTER TABLE ONLY public.contact_contactentry ALTER COLUMN id SET DEFAULT nextval('public.contact_contactentry_id_seq'::regclass);
 F   ALTER TABLE public.contact_contactentry ALTER COLUMN id DROP DEFAULT;
       public          taiga    false    270    271    271            �           2604    9872850 (   custom_attributes_epiccustomattribute id    DEFAULT     �   ALTER TABLE ONLY public.custom_attributes_epiccustomattribute ALTER COLUMN id SET DEFAULT nextval('public.custom_attributes_epiccustomattribute_id_seq'::regclass);
 W   ALTER TABLE public.custom_attributes_epiccustomattribute ALTER COLUMN id DROP DEFAULT;
       public          taiga    false    294    293    294            �           2604    9872861 /   custom_attributes_epiccustomattributesvalues id    DEFAULT     �   ALTER TABLE ONLY public.custom_attributes_epiccustomattributesvalues ALTER COLUMN id SET DEFAULT nextval('public.custom_attributes_epiccustomattributesvalues_id_seq'::regclass);
 ^   ALTER TABLE public.custom_attributes_epiccustomattributesvalues ALTER COLUMN id DROP DEFAULT;
       public          taiga    false    295    296    296            �           2604    9872725 )   custom_attributes_issuecustomattribute id    DEFAULT     �   ALTER TABLE ONLY public.custom_attributes_issuecustomattribute ALTER COLUMN id SET DEFAULT nextval('public.custom_attributes_issuecustomattribute_id_seq'::regclass);
 X   ALTER TABLE public.custom_attributes_issuecustomattribute ALTER COLUMN id DROP DEFAULT;
       public          taiga    false    282    281    282            �           2604    9872782 0   custom_attributes_issuecustomattributesvalues id    DEFAULT     �   ALTER TABLE ONLY public.custom_attributes_issuecustomattributesvalues ALTER COLUMN id SET DEFAULT nextval('public.custom_attributes_issuecustomattributesvalues_id_seq'::regclass);
 _   ALTER TABLE public.custom_attributes_issuecustomattributesvalues ALTER COLUMN id DROP DEFAULT;
       public          taiga    false    288    287    288            �           2604    9872736 (   custom_attributes_taskcustomattribute id    DEFAULT     �   ALTER TABLE ONLY public.custom_attributes_taskcustomattribute ALTER COLUMN id SET DEFAULT nextval('public.custom_attributes_taskcustomattribute_id_seq'::regclass);
 W   ALTER TABLE public.custom_attributes_taskcustomattribute ALTER COLUMN id DROP DEFAULT;
       public          taiga    false    284    283    284            �           2604    9872795 /   custom_attributes_taskcustomattributesvalues id    DEFAULT     �   ALTER TABLE ONLY public.custom_attributes_taskcustomattributesvalues ALTER COLUMN id SET DEFAULT nextval('public.custom_attributes_taskcustomattributesvalues_id_seq'::regclass);
 ^   ALTER TABLE public.custom_attributes_taskcustomattributesvalues ALTER COLUMN id DROP DEFAULT;
       public          taiga    false    290    289    290            �           2604    9872747 -   custom_attributes_userstorycustomattribute id    DEFAULT     �   ALTER TABLE ONLY public.custom_attributes_userstorycustomattribute ALTER COLUMN id SET DEFAULT nextval('public.custom_attributes_userstorycustomattribute_id_seq'::regclass);
 \   ALTER TABLE public.custom_attributes_userstorycustomattribute ALTER COLUMN id DROP DEFAULT;
       public          taiga    false    285    286    286            �           2604    9872808 4   custom_attributes_userstorycustomattributesvalues id    DEFAULT     �   ALTER TABLE ONLY public.custom_attributes_userstorycustomattributesvalues ALTER COLUMN id SET DEFAULT nextval('public.custom_attributes_userstorycustomattributesvalues_id_seq'::regclass);
 c   ALTER TABLE public.custom_attributes_userstorycustomattributesvalues ALTER COLUMN id DROP DEFAULT;
       public          taiga    false    291    292    292            �           2604    9871312    django_admin_log id    DEFAULT     z   ALTER TABLE ONLY public.django_admin_log ALTER COLUMN id SET DEFAULT nextval('public.django_admin_log_id_seq'::regclass);
 B   ALTER TABLE public.django_admin_log ALTER COLUMN id DROP DEFAULT;
       public          taiga    false    208    209    209            �           2604    9871288    django_content_type id    DEFAULT     �   ALTER TABLE ONLY public.django_content_type ALTER COLUMN id SET DEFAULT nextval('public.django_content_type_id_seq'::regclass);
 E   ALTER TABLE public.django_content_type ALTER COLUMN id DROP DEFAULT;
       public          taiga    false    205    204    205            �           2604    9871277    django_migrations id    DEFAULT     |   ALTER TABLE ONLY public.django_migrations ALTER COLUMN id SET DEFAULT nextval('public.django_migrations_id_seq'::regclass);
 C   ALTER TABLE public.django_migrations ALTER COLUMN id DROP DEFAULT;
       public          taiga    false    202    203    203            �           2604    9872971    easy_thumbnails_source id    DEFAULT     �   ALTER TABLE ONLY public.easy_thumbnails_source ALTER COLUMN id SET DEFAULT nextval('public.easy_thumbnails_source_id_seq'::regclass);
 H   ALTER TABLE public.easy_thumbnails_source ALTER COLUMN id DROP DEFAULT;
       public          taiga    false    298    299    299            �           2604    9872979    easy_thumbnails_thumbnail id    DEFAULT     �   ALTER TABLE ONLY public.easy_thumbnails_thumbnail ALTER COLUMN id SET DEFAULT nextval('public.easy_thumbnails_thumbnail_id_seq'::regclass);
 K   ALTER TABLE public.easy_thumbnails_thumbnail ALTER COLUMN id DROP DEFAULT;
       public          taiga    false    300    301    301            �           2604    9873005 &   easy_thumbnails_thumbnaildimensions id    DEFAULT     �   ALTER TABLE ONLY public.easy_thumbnails_thumbnaildimensions ALTER COLUMN id SET DEFAULT nextval('public.easy_thumbnails_thumbnaildimensions_id_seq'::regclass);
 U   ALTER TABLE public.easy_thumbnails_thumbnaildimensions ALTER COLUMN id DROP DEFAULT;
       public          taiga    false    303    302    303            �           2604    9872666    epics_epic id    DEFAULT     n   ALTER TABLE ONLY public.epics_epic ALTER COLUMN id SET DEFAULT nextval('public.epics_epic_id_seq'::regclass);
 <   ALTER TABLE public.epics_epic ALTER COLUMN id DROP DEFAULT;
       public          taiga    false    277    278    278            �           2604    9872677    epics_relateduserstory id    DEFAULT     �   ALTER TABLE ONLY public.epics_relateduserstory ALTER COLUMN id SET DEFAULT nextval('public.epics_relateduserstory_id_seq'::regclass);
 H   ALTER TABLE public.epics_relateduserstory ALTER COLUMN id DROP DEFAULT;
       public          taiga    false    279    280    280            �           2604    9873056 !   external_apps_applicationtoken id    DEFAULT     �   ALTER TABLE ONLY public.external_apps_applicationtoken ALTER COLUMN id SET DEFAULT nextval('public.external_apps_applicationtoken_id_seq'::regclass);
 P   ALTER TABLE public.external_apps_applicationtoken ALTER COLUMN id DROP DEFAULT;
       public          taiga    false    306    305    306            �           2604    9873083    feedback_feedbackentry id    DEFAULT     �   ALTER TABLE ONLY public.feedback_feedbackentry ALTER COLUMN id SET DEFAULT nextval('public.feedback_feedbackentry_id_seq'::regclass);
 H   ALTER TABLE public.feedback_feedbackentry ALTER COLUMN id DROP DEFAULT;
       public          taiga    false    308    307    308            �           2604    9871741    issues_issue id    DEFAULT     r   ALTER TABLE ONLY public.issues_issue ALTER COLUMN id SET DEFAULT nextval('public.issues_issue_id_seq'::regclass);
 >   ALTER TABLE public.issues_issue ALTER COLUMN id DROP DEFAULT;
       public          taiga    false    243    242    243            �           2604    9872328    likes_like id    DEFAULT     n   ALTER TABLE ONLY public.likes_like ALTER COLUMN id SET DEFAULT nextval('public.likes_like_id_seq'::regclass);
 <   ALTER TABLE public.likes_like ALTER COLUMN id DROP DEFAULT;
       public          taiga    false    266    267    267            �           2604    9871690    milestones_milestone id    DEFAULT     �   ALTER TABLE ONLY public.milestones_milestone ALTER COLUMN id SET DEFAULT nextval('public.milestones_milestone_id_seq'::regclass);
 F   ALTER TABLE public.milestones_milestone ALTER COLUMN id DROP DEFAULT;
       public          taiga    false    241    240    241            �           2604    9872001 *   notifications_historychangenotification id    DEFAULT     �   ALTER TABLE ONLY public.notifications_historychangenotification ALTER COLUMN id SET DEFAULT nextval('public.notifications_historychangenotification_id_seq'::regclass);
 Y   ALTER TABLE public.notifications_historychangenotification ALTER COLUMN id DROP DEFAULT;
       public          taiga    false    251    250    251            �           2604    9872009 :   notifications_historychangenotification_history_entries id    DEFAULT     �   ALTER TABLE ONLY public.notifications_historychangenotification_history_entries ALTER COLUMN id SET DEFAULT nextval('public.notifications_historychangenotification_history_entries_id_seq'::regclass);
 i   ALTER TABLE public.notifications_historychangenotification_history_entries ALTER COLUMN id DROP DEFAULT;
       public          taiga    false    253    252    253            �           2604    9872017 7   notifications_historychangenotification_notify_users id    DEFAULT     �   ALTER TABLE ONLY public.notifications_historychangenotification_notify_users ALTER COLUMN id SET DEFAULT nextval('public.notifications_historychangenotification_notify_users_id_seq'::regclass);
 f   ALTER TABLE public.notifications_historychangenotification_notify_users ALTER COLUMN id DROP DEFAULT;
       public          taiga    false    255    254    255            �           2604    9871958    notifications_notifypolicy id    DEFAULT     �   ALTER TABLE ONLY public.notifications_notifypolicy ALTER COLUMN id SET DEFAULT nextval('public.notifications_notifypolicy_id_seq'::regclass);
 L   ALTER TABLE public.notifications_notifypolicy ALTER COLUMN id DROP DEFAULT;
       public          taiga    false    248    249    249            �           2604    9872068    notifications_watched id    DEFAULT     �   ALTER TABLE ONLY public.notifications_watched ALTER COLUMN id SET DEFAULT nextval('public.notifications_watched_id_seq'::regclass);
 G   ALTER TABLE public.notifications_watched ALTER COLUMN id DROP DEFAULT;
       public          taiga    false    257    256    257            �           2604    9873142     notifications_webnotification id    DEFAULT     �   ALTER TABLE ONLY public.notifications_webnotification ALTER COLUMN id SET DEFAULT nextval('public.notifications_webnotification_id_seq'::regclass);
 O   ALTER TABLE public.notifications_webnotification ALTER COLUMN id DROP DEFAULT;
       public          taiga    false    309    310    310            �           2604    9872435    projects_epicstatus id    DEFAULT     �   ALTER TABLE ONLY public.projects_epicstatus ALTER COLUMN id SET DEFAULT nextval('public.projects_epicstatus_id_seq'::regclass);
 E   ALTER TABLE public.projects_epicstatus ALTER COLUMN id DROP DEFAULT;
       public          taiga    false    269    268    269            �           2604    9873185    projects_issueduedate id    DEFAULT     �   ALTER TABLE ONLY public.projects_issueduedate ALTER COLUMN id SET DEFAULT nextval('public.projects_issueduedate_id_seq'::regclass);
 G   ALTER TABLE public.projects_issueduedate ALTER COLUMN id DROP DEFAULT;
       public          taiga    false    314    313    314            �           2604    9871402    projects_issuestatus id    DEFAULT     �   ALTER TABLE ONLY public.projects_issuestatus ALTER COLUMN id SET DEFAULT nextval('public.projects_issuestatus_id_seq'::regclass);
 F   ALTER TABLE public.projects_issuestatus ALTER COLUMN id DROP DEFAULT;
       public          taiga    false    216    217    217            �           2604    9871410    projects_issuetype id    DEFAULT     ~   ALTER TABLE ONLY public.projects_issuetype ALTER COLUMN id SET DEFAULT nextval('public.projects_issuetype_id_seq'::regclass);
 D   ALTER TABLE public.projects_issuetype ALTER COLUMN id DROP DEFAULT;
       public          taiga    false    218    219    219            �           2604    9871349    projects_membership id    DEFAULT     �   ALTER TABLE ONLY public.projects_membership ALTER COLUMN id SET DEFAULT nextval('public.projects_membership_id_seq'::regclass);
 E   ALTER TABLE public.projects_membership ALTER COLUMN id DROP DEFAULT;
       public          taiga    false    212    213    213            �           2604    9871418    projects_points id    DEFAULT     x   ALTER TABLE ONLY public.projects_points ALTER COLUMN id SET DEFAULT nextval('public.projects_points_id_seq'::regclass);
 A   ALTER TABLE public.projects_points ALTER COLUMN id DROP DEFAULT;
       public          taiga    false    221    220    221            �           2604    9871426    projects_priority id    DEFAULT     |   ALTER TABLE ONLY public.projects_priority ALTER COLUMN id SET DEFAULT nextval('public.projects_priority_id_seq'::regclass);
 C   ALTER TABLE public.projects_priority ALTER COLUMN id DROP DEFAULT;
       public          taiga    false    223    222    223            �           2604    9871357    projects_project id    DEFAULT     z   ALTER TABLE ONLY public.projects_project ALTER COLUMN id SET DEFAULT nextval('public.projects_project_id_seq'::regclass);
 B   ALTER TABLE public.projects_project ALTER COLUMN id DROP DEFAULT;
       public          taiga    false    214    215    215            �           2604    9872253     projects_projectmodulesconfig id    DEFAULT     �   ALTER TABLE ONLY public.projects_projectmodulesconfig ALTER COLUMN id SET DEFAULT nextval('public.projects_projectmodulesconfig_id_seq'::regclass);
 O   ALTER TABLE public.projects_projectmodulesconfig ALTER COLUMN id DROP DEFAULT;
       public          taiga    false    262    263    263            �           2604    9871434    projects_projecttemplate id    DEFAULT     �   ALTER TABLE ONLY public.projects_projecttemplate ALTER COLUMN id SET DEFAULT nextval('public.projects_projecttemplate_id_seq'::regclass);
 J   ALTER TABLE public.projects_projecttemplate ALTER COLUMN id DROP DEFAULT;
       public          taiga    false    225    224    225            �           2604    9871447    projects_severity id    DEFAULT     |   ALTER TABLE ONLY public.projects_severity ALTER COLUMN id SET DEFAULT nextval('public.projects_severity_id_seq'::regclass);
 C   ALTER TABLE public.projects_severity ALTER COLUMN id DROP DEFAULT;
       public          taiga    false    226    227    227            �           2604    9873240    projects_swimlane id    DEFAULT     |   ALTER TABLE ONLY public.projects_swimlane ALTER COLUMN id SET DEFAULT nextval('public.projects_swimlane_id_seq'::regclass);
 C   ALTER TABLE public.projects_swimlane ALTER COLUMN id DROP DEFAULT;
       public          taiga    false    320    319    320            �           2604    9873257 #   projects_swimlaneuserstorystatus id    DEFAULT     �   ALTER TABLE ONLY public.projects_swimlaneuserstorystatus ALTER COLUMN id SET DEFAULT nextval('public.projects_swimlaneuserstorystatus_id_seq'::regclass);
 R   ALTER TABLE public.projects_swimlaneuserstorystatus ALTER COLUMN id DROP DEFAULT;
       public          taiga    false    321    322    322            �           2604    9873193    projects_taskduedate id    DEFAULT     �   ALTER TABLE ONLY public.projects_taskduedate ALTER COLUMN id SET DEFAULT nextval('public.projects_taskduedate_id_seq'::regclass);
 F   ALTER TABLE public.projects_taskduedate ALTER COLUMN id DROP DEFAULT;
       public          taiga    false    315    316    316            �           2604    9871455    projects_taskstatus id    DEFAULT     �   ALTER TABLE ONLY public.projects_taskstatus ALTER COLUMN id SET DEFAULT nextval('public.projects_taskstatus_id_seq'::regclass);
 E   ALTER TABLE public.projects_taskstatus ALTER COLUMN id DROP DEFAULT;
       public          taiga    false    229    228    229            �           2604    9873201    projects_userstoryduedate id    DEFAULT     �   ALTER TABLE ONLY public.projects_userstoryduedate ALTER COLUMN id SET DEFAULT nextval('public.projects_userstoryduedate_id_seq'::regclass);
 K   ALTER TABLE public.projects_userstoryduedate ALTER COLUMN id DROP DEFAULT;
       public          taiga    false    318    317    318            �           2604    9871463    projects_userstorystatus id    DEFAULT     �   ALTER TABLE ONLY public.projects_userstorystatus ALTER COLUMN id SET DEFAULT nextval('public.projects_userstorystatus_id_seq'::regclass);
 J   ALTER TABLE public.projects_userstorystatus ALTER COLUMN id DROP DEFAULT;
       public          taiga    false    231    230    231            �           2604    9873296    references_reference id    DEFAULT     �   ALTER TABLE ONLY public.references_reference ALTER COLUMN id SET DEFAULT nextval('public.references_reference_id_seq'::regclass);
 F   ALTER TABLE public.references_reference ALTER COLUMN id DROP DEFAULT;
       public          taiga    false    324    323    324            �           2604    9873329    settings_userprojectsettings id    DEFAULT     �   ALTER TABLE ONLY public.settings_userprojectsettings ALTER COLUMN id SET DEFAULT nextval('public.settings_userprojectsettings_id_seq'::regclass);
 N   ALTER TABLE public.settings_userprojectsettings ALTER COLUMN id DROP DEFAULT;
       public          taiga    false    327    326    327            �           2604    9872097    tasks_task id    DEFAULT     n   ALTER TABLE ONLY public.tasks_task ALTER COLUMN id SET DEFAULT nextval('public.tasks_task_id_seq'::regclass);
 <   ALTER TABLE public.tasks_task ALTER COLUMN id DROP DEFAULT;
       public          taiga    false    258    259    259            �           2604    9873385    telemetry_instancetelemetry id    DEFAULT     �   ALTER TABLE ONLY public.telemetry_instancetelemetry ALTER COLUMN id SET DEFAULT nextval('public.telemetry_instancetelemetry_id_seq'::regclass);
 M   ALTER TABLE public.telemetry_instancetelemetry ALTER COLUMN id DROP DEFAULT;
       public          taiga    false    329    328    329            �           2604    9872278    timeline_timeline id    DEFAULT     |   ALTER TABLE ONLY public.timeline_timeline ALTER COLUMN id SET DEFAULT nextval('public.timeline_timeline_id_seq'::regclass);
 C   ALTER TABLE public.timeline_timeline ALTER COLUMN id DROP DEFAULT;
       public          taiga    false    264    265    265            �           2604    9873426 !   token_denylist_denylistedtoken id    DEFAULT     �   ALTER TABLE ONLY public.token_denylist_denylistedtoken ALTER COLUMN id SET DEFAULT nextval('public.token_denylist_denylistedtoken_id_seq'::regclass);
 P   ALTER TABLE public.token_denylist_denylistedtoken ALTER COLUMN id DROP DEFAULT;
       public          taiga    false    333    332    333            �           2604    9873413 "   token_denylist_outstandingtoken id    DEFAULT     �   ALTER TABLE ONLY public.token_denylist_outstandingtoken ALTER COLUMN id SET DEFAULT nextval('public.token_denylist_outstandingtoken_id_seq'::regclass);
 Q   ALTER TABLE public.token_denylist_outstandingtoken ALTER COLUMN id DROP DEFAULT;
       public          taiga    false    331    330    331            �           2604    9872179    users_authdata id    DEFAULT     v   ALTER TABLE ONLY public.users_authdata ALTER COLUMN id SET DEFAULT nextval('public.users_authdata_id_seq'::regclass);
 @   ALTER TABLE public.users_authdata ALTER COLUMN id DROP DEFAULT;
       public          taiga    false    261    260    261            �           2604    9871336    users_role id    DEFAULT     n   ALTER TABLE ONLY public.users_role ALTER COLUMN id SET DEFAULT nextval('public.users_role_id_seq'::regclass);
 <   ALTER TABLE public.users_role ALTER COLUMN id DROP DEFAULT;
       public          taiga    false    211    210    211            �           2604    9871298    users_user id    DEFAULT     n   ALTER TABLE ONLY public.users_user ALTER COLUMN id SET DEFAULT nextval('public.users_user_id_seq'::regclass);
 <   ALTER TABLE public.users_user ALTER COLUMN id DROP DEFAULT;
       public          taiga    false    207    206    207            �           2604    9873470    users_workspacerole id    DEFAULT     �   ALTER TABLE ONLY public.users_workspacerole ALTER COLUMN id SET DEFAULT nextval('public.users_workspacerole_id_seq'::regclass);
 E   ALTER TABLE public.users_workspacerole ALTER COLUMN id DROP DEFAULT;
       public          taiga    false    334    335    335            �           2604    9873491    userstorage_storageentry id    DEFAULT     �   ALTER TABLE ONLY public.userstorage_storageentry ALTER COLUMN id SET DEFAULT nextval('public.userstorage_storageentry_id_seq'::regclass);
 J   ALTER TABLE public.userstorage_storageentry ALTER COLUMN id DROP DEFAULT;
       public          taiga    false    337    336    337            �           2604    9871823    userstories_rolepoints id    DEFAULT     �   ALTER TABLE ONLY public.userstories_rolepoints ALTER COLUMN id SET DEFAULT nextval('public.userstories_rolepoints_id_seq'::regclass);
 H   ALTER TABLE public.userstories_rolepoints ALTER COLUMN id DROP DEFAULT;
       public          taiga    false    245    244    245            �           2604    9871831    userstories_userstory id    DEFAULT     �   ALTER TABLE ONLY public.userstories_userstory ALTER COLUMN id SET DEFAULT nextval('public.userstories_userstory_id_seq'::regclass);
 G   ALTER TABLE public.userstories_userstory ALTER COLUMN id DROP DEFAULT;
       public          taiga    false    247    246    247            �           2604    9873562 '   userstories_userstory_assigned_users id    DEFAULT     �   ALTER TABLE ONLY public.userstories_userstory_assigned_users ALTER COLUMN id SET DEFAULT nextval('public.userstories_userstory_assigned_users_id_seq'::regclass);
 V   ALTER TABLE public.userstories_userstory_assigned_users ALTER COLUMN id DROP DEFAULT;
       public          taiga    false    338    339    339            �           2604    9873601    votes_vote id    DEFAULT     n   ALTER TABLE ONLY public.votes_vote ALTER COLUMN id SET DEFAULT nextval('public.votes_vote_id_seq'::regclass);
 <   ALTER TABLE public.votes_vote ALTER COLUMN id DROP DEFAULT;
       public          taiga    false    340    341    341            �           2604    9873610    votes_votes id    DEFAULT     p   ALTER TABLE ONLY public.votes_votes ALTER COLUMN id SET DEFAULT nextval('public.votes_votes_id_seq'::regclass);
 =   ALTER TABLE public.votes_votes ALTER COLUMN id DROP DEFAULT;
       public          taiga    false    342    343    343            �           2604    9873648    webhooks_webhook id    DEFAULT     z   ALTER TABLE ONLY public.webhooks_webhook ALTER COLUMN id SET DEFAULT nextval('public.webhooks_webhook_id_seq'::regclass);
 B   ALTER TABLE public.webhooks_webhook ALTER COLUMN id DROP DEFAULT;
       public          taiga    false    345    344    345            �           2604    9873659    webhooks_webhooklog id    DEFAULT     �   ALTER TABLE ONLY public.webhooks_webhooklog ALTER COLUMN id SET DEFAULT nextval('public.webhooks_webhooklog_id_seq'::regclass);
 E   ALTER TABLE public.webhooks_webhooklog ALTER COLUMN id DROP DEFAULT;
       public          taiga    false    346    347    347            �           2604    9872537    wiki_wikilink id    DEFAULT     t   ALTER TABLE ONLY public.wiki_wikilink ALTER COLUMN id SET DEFAULT nextval('public.wiki_wikilink_id_seq'::regclass);
 ?   ALTER TABLE public.wiki_wikilink ALTER COLUMN id DROP DEFAULT;
       public          taiga    false    273    272    273            �           2604    9872549    wiki_wikipage id    DEFAULT     t   ALTER TABLE ONLY public.wiki_wikipage ALTER COLUMN id SET DEFAULT nextval('public.wiki_wikipage_id_seq'::regclass);
 ?   ALTER TABLE public.wiki_wikipage ALTER COLUMN id DROP DEFAULT;
       public          taiga    false    275    274    275            �           2604    9873162    workspaces_workspace id    DEFAULT     �   ALTER TABLE ONLY public.workspaces_workspace ALTER COLUMN id SET DEFAULT nextval('public.workspaces_workspace_id_seq'::regclass);
 F   ALTER TABLE public.workspaces_workspace ALTER COLUMN id DROP DEFAULT;
       public          taiga    false    312    311    312            �           2604    9873706 !   workspaces_workspacemembership id    DEFAULT     �   ALTER TABLE ONLY public.workspaces_workspacemembership ALTER COLUMN id SET DEFAULT nextval('public.workspaces_workspacemembership_id_seq'::regclass);
 P   ALTER TABLE public.workspaces_workspacemembership ALTER COLUMN id DROP DEFAULT;
       public          taiga    false    348    349    349                      0    9871580    attachments_attachment 
   TABLE DATA           �   COPY public.attachments_attachment (id, object_id, created_date, modified_date, attached_file, is_deprecated, description, "order", content_type_id, owner_id, project_id, name, size, sha1, from_comment) FROM stdin;
    public          taiga    false    233   ��                0    9871627 
   auth_group 
   TABLE DATA           .   COPY public.auth_group (id, name) FROM stdin;
    public          taiga    false    237   ��                0    9871637    auth_group_permissions 
   TABLE DATA           M   COPY public.auth_group_permissions (id, group_id, permission_id) FROM stdin;
    public          taiga    false    239   �                0    9871619    auth_permission 
   TABLE DATA           N   COPY public.auth_permission (id, name, content_type_id, codename) FROM stdin;
    public          taiga    false    235   5�      3          0    9872511    contact_contactentry 
   TABLE DATA           ^   COPY public.contact_contactentry (id, comment, created_date, project_id, user_id) FROM stdin;
    public          taiga    false    271   B      J          0    9872847 %   custom_attributes_epiccustomattribute 
   TABLE DATA           �   COPY public.custom_attributes_epiccustomattribute (id, name, description, type, "order", created_date, modified_date, project_id, extra) FROM stdin;
    public          taiga    false    294   _      L          0    9872858 ,   custom_attributes_epiccustomattributesvalues 
   TABLE DATA           o   COPY public.custom_attributes_epiccustomattributesvalues (id, version, attributes_values, epic_id) FROM stdin;
    public          taiga    false    296   |      >          0    9872722 &   custom_attributes_issuecustomattribute 
   TABLE DATA           �   COPY public.custom_attributes_issuecustomattribute (id, name, description, "order", created_date, modified_date, project_id, type, extra) FROM stdin;
    public          taiga    false    282   �      D          0    9872779 -   custom_attributes_issuecustomattributesvalues 
   TABLE DATA           q   COPY public.custom_attributes_issuecustomattributesvalues (id, version, attributes_values, issue_id) FROM stdin;
    public          taiga    false    288   �      @          0    9872733 %   custom_attributes_taskcustomattribute 
   TABLE DATA           �   COPY public.custom_attributes_taskcustomattribute (id, name, description, "order", created_date, modified_date, project_id, type, extra) FROM stdin;
    public          taiga    false    284   �      F          0    9872792 ,   custom_attributes_taskcustomattributesvalues 
   TABLE DATA           o   COPY public.custom_attributes_taskcustomattributesvalues (id, version, attributes_values, task_id) FROM stdin;
    public          taiga    false    290   �      B          0    9872744 *   custom_attributes_userstorycustomattribute 
   TABLE DATA           �   COPY public.custom_attributes_userstorycustomattribute (id, name, description, "order", created_date, modified_date, project_id, type, extra) FROM stdin;
    public          taiga    false    286         H          0    9872805 1   custom_attributes_userstorycustomattributesvalues 
   TABLE DATA           z   COPY public.custom_attributes_userstorycustomattributesvalues (id, version, attributes_values, user_story_id) FROM stdin;
    public          taiga    false    292   *      �          0    9871309    django_admin_log 
   TABLE DATA           �   COPY public.django_admin_log (id, action_time, object_id, object_repr, action_flag, change_message, content_type_id, user_id) FROM stdin;
    public          taiga    false    209   G      �          0    9871285    django_content_type 
   TABLE DATA           C   COPY public.django_content_type (id, app_label, model) FROM stdin;
    public          taiga    false    205   d      �          0    9871274    django_migrations 
   TABLE DATA           C   COPY public.django_migrations (id, app, name, applied) FROM stdin;
    public          taiga    false    203         i          0    9873314    django_session 
   TABLE DATA           P   COPY public.django_session (session_key, session_data, expire_date) FROM stdin;
    public          taiga    false    325   �      M          0    9872957    djmail_message 
   TABLE DATA           �   COPY public.djmail_message (uuid, from_email, to_email, body_text, body_html, subject, data, retry_count, status, priority, created_at, sent_at, exception) FROM stdin;
    public          taiga    false    297         O          0    9872968    easy_thumbnails_source 
   TABLE DATA           R   COPY public.easy_thumbnails_source (id, storage_hash, name, modified) FROM stdin;
    public          taiga    false    299   9      Q          0    9872976    easy_thumbnails_thumbnail 
   TABLE DATA           `   COPY public.easy_thumbnails_thumbnail (id, storage_hash, name, modified, source_id) FROM stdin;
    public          taiga    false    301   V      S          0    9873002 #   easy_thumbnails_thumbnaildimensions 
   TABLE DATA           ^   COPY public.easy_thumbnails_thumbnaildimensions (id, thumbnail_id, width, height) FROM stdin;
    public          taiga    false    303   s      :          0    9872663 
   epics_epic 
   TABLE DATA             COPY public.epics_epic (id, tags, version, is_blocked, blocked_note, ref, epics_order, created_date, modified_date, subject, description, client_requirement, team_requirement, assigned_to_id, owner_id, project_id, status_id, color, external_reference) FROM stdin;
    public          taiga    false    278   �      <          0    9872674    epics_relateduserstory 
   TABLE DATA           U   COPY public.epics_relateduserstory (id, "order", epic_id, user_story_id) FROM stdin;
    public          taiga    false    280   �      T          0    9873043    external_apps_application 
   TABLE DATA           c   COPY public.external_apps_application (id, name, icon_url, web, description, next_url) FROM stdin;
    public          taiga    false    304   �      V          0    9873053    external_apps_applicationtoken 
   TABLE DATA           n   COPY public.external_apps_applicationtoken (id, auth_code, token, state, application_id, user_id) FROM stdin;
    public          taiga    false    306   �      X          0    9873080    feedback_feedbackentry 
   TABLE DATA           ]   COPY public.feedback_feedbackentry (id, full_name, email, comment, created_date) FROM stdin;
    public          taiga    false    308         8          0    9872625    history_historyentry 
   TABLE DATA             COPY public.history_historyentry (id, "user", created_at, type, is_snapshot, key, diff, snapshot, "values", comment, comment_html, delete_comment_date, delete_comment_user, is_hidden, comment_versions, edit_comment_date, project_id, values_diff_cache) FROM stdin;
    public          taiga    false    276   !                0    9871738    issues_issue 
   TABLE DATA           +  COPY public.issues_issue (id, tags, version, is_blocked, blocked_note, ref, created_date, modified_date, finished_date, subject, description, assigned_to_id, milestone_id, owner_id, priority_id, project_id, severity_id, status_id, type_id, external_reference, due_date, due_date_reason) FROM stdin;
    public          taiga    false    243   >      /          0    9872325 
   likes_like 
   TABLE DATA           [   COPY public.likes_like (id, object_id, created_date, content_type_id, user_id) FROM stdin;
    public          taiga    false    267   [                0    9871687    milestones_milestone 
   TABLE DATA           �   COPY public.milestones_milestone (id, name, slug, estimated_start, estimated_finish, created_date, modified_date, closed, disponibility, "order", owner_id, project_id) FROM stdin;
    public          taiga    false    241   x                0    9871998 '   notifications_historychangenotification 
   TABLE DATA           �   COPY public.notifications_historychangenotification (id, key, created_datetime, updated_datetime, history_type, owner_id, project_id) FROM stdin;
    public          taiga    false    251   �      !          0    9872006 7   notifications_historychangenotification_history_entries 
   TABLE DATA           �   COPY public.notifications_historychangenotification_history_entries (id, historychangenotification_id, historyentry_id) FROM stdin;
    public          taiga    false    253   �      #          0    9872014 4   notifications_historychangenotification_notify_users 
   TABLE DATA           y   COPY public.notifications_historychangenotification_notify_users (id, historychangenotification_id, user_id) FROM stdin;
    public          taiga    false    255   �                0    9871955    notifications_notifypolicy 
   TABLE DATA           �   COPY public.notifications_notifypolicy (id, notify_level, created_at, modified_at, project_id, user_id, live_notify_level, web_notify_level) FROM stdin;
    public          taiga    false    249   �      %          0    9872065    notifications_watched 
   TABLE DATA           r   COPY public.notifications_watched (id, object_id, created_date, content_type_id, user_id, project_id) FROM stdin;
    public          taiga    false    257   �#      Z          0    9873139    notifications_webnotification 
   TABLE DATA           e   COPY public.notifications_webnotification (id, created, read, event_type, data, user_id) FROM stdin;
    public          taiga    false    310   �#      1          0    9872432    projects_epicstatus 
   TABLE DATA           d   COPY public.projects_epicstatus (id, name, slug, "order", is_closed, color, project_id) FROM stdin;
    public          taiga    false    269   �#      ^          0    9873182    projects_issueduedate 
   TABLE DATA           n   COPY public.projects_issueduedate (id, name, "order", by_default, color, days_to_due, project_id) FROM stdin;
    public          taiga    false    314   �%      �          0    9871399    projects_issuestatus 
   TABLE DATA           e   COPY public.projects_issuestatus (id, name, "order", is_closed, color, project_id, slug) FROM stdin;
    public          taiga    false    217   V'      �          0    9871407    projects_issuetype 
   TABLE DATA           R   COPY public.projects_issuetype (id, name, "order", color, project_id) FROM stdin;
    public          taiga    false    219   �+      �          0    9871346    projects_membership 
   TABLE DATA           �   COPY public.projects_membership (id, is_admin, email, created_at, token, user_id, project_id, role_id, invited_by_id, invitation_extra_text, user_order) FROM stdin;
    public          taiga    false    213   -                0    9871415    projects_points 
   TABLE DATA           O   COPY public.projects_points (id, name, "order", value, project_id) FROM stdin;
    public          taiga    false    221   g3                0    9871423    projects_priority 
   TABLE DATA           Q   COPY public.projects_priority (id, name, "order", color, project_id) FROM stdin;
    public          taiga    false    223   B7      �          0    9871354    projects_project 
   TABLE DATA             COPY public.projects_project (id, tags, name, slug, description, created_date, modified_date, total_milestones, total_story_points, is_backlog_activated, is_kanban_activated, is_wiki_activated, is_issues_activated, videoconferences, videoconferences_extra_data, anon_permissions, public_permissions, is_private, tags_colors, owner_id, creation_template_id, default_issue_status_id, default_issue_type_id, default_points_id, default_priority_id, default_severity_id, default_task_status_id, default_us_status_id, issues_csv_uuid, tasks_csv_uuid, userstories_csv_uuid, is_featured, is_looking_for_people, total_activity, total_activity_last_month, total_activity_last_week, total_activity_last_year, total_fans, total_fans_last_month, total_fans_last_week, total_fans_last_year, totals_updated_datetime, logo, looking_for_people_note, blocked_code, transfer_token, is_epics_activated, default_epic_status_id, epics_csv_uuid, is_contact_activated, default_swimlane_id, workspace_id, color, workspace_member_permissions) FROM stdin;
    public          taiga    false    215   �8      +          0    9872250    projects_projectmodulesconfig 
   TABLE DATA           O   COPY public.projects_projectmodulesconfig (id, config, project_id) FROM stdin;
    public          taiga    false    263   jG                0    9871431    projects_projecttemplate 
   TABLE DATA           �  COPY public.projects_projecttemplate (id, name, slug, description, created_date, modified_date, default_owner_role, is_backlog_activated, is_kanban_activated, is_wiki_activated, is_issues_activated, videoconferences, videoconferences_extra_data, default_options, us_statuses, points, task_statuses, issue_statuses, issue_types, priorities, severities, roles, "order", epic_statuses, is_epics_activated, is_contact_activated, epic_custom_attributes, is_looking_for_people, issue_custom_attributes, looking_for_people_note, tags, tags_colors, task_custom_attributes, us_custom_attributes, issue_duedates, task_duedates, us_duedates) FROM stdin;
    public          taiga    false    225   �G                0    9871444    projects_severity 
   TABLE DATA           Q   COPY public.projects_severity (id, name, "order", color, project_id) FROM stdin;
    public          taiga    false    227   =M      d          0    9873237    projects_swimlane 
   TABLE DATA           J   COPY public.projects_swimlane (id, name, "order", project_id) FROM stdin;
    public          taiga    false    320   "O      f          0    9873254     projects_swimlaneuserstorystatus 
   TABLE DATA           a   COPY public.projects_swimlaneuserstorystatus (id, wip_limit, status_id, swimlane_id) FROM stdin;
    public          taiga    false    322   ?O      `          0    9873190    projects_taskduedate 
   TABLE DATA           m   COPY public.projects_taskduedate (id, name, "order", by_default, color, days_to_due, project_id) FROM stdin;
    public          taiga    false    316   \O      	          0    9871452    projects_taskstatus 
   TABLE DATA           d   COPY public.projects_taskstatus (id, name, "order", is_closed, color, project_id, slug) FROM stdin;
    public          taiga    false    229   �P      b          0    9873198    projects_userstoryduedate 
   TABLE DATA           r   COPY public.projects_userstoryduedate (id, name, "order", by_default, color, days_to_due, project_id) FROM stdin;
    public          taiga    false    318   �S                0    9871460    projects_userstorystatus 
   TABLE DATA           �   COPY public.projects_userstorystatus (id, name, "order", is_closed, color, wip_limit, project_id, slug, is_archived) FROM stdin;
    public          taiga    false    231    U      h          0    9873293    references_reference 
   TABLE DATA           k   COPY public.references_reference (id, object_id, ref, created_at, content_type_id, project_id) FROM stdin;
    public          taiga    false    324   �X      k          0    9873326    settings_userprojectsettings 
   TABLE DATA           r   COPY public.settings_userprojectsettings (id, homepage, created_at, modified_at, project_id, user_id) FROM stdin;
    public          taiga    false    327   �X      '          0    9872094 
   tasks_task 
   TABLE DATA           <  COPY public.tasks_task (id, tags, version, is_blocked, blocked_note, ref, created_date, modified_date, finished_date, subject, description, is_iocaine, assigned_to_id, milestone_id, owner_id, project_id, status_id, user_story_id, taskboard_order, us_order, external_reference, due_date, due_date_reason) FROM stdin;
    public          taiga    false    259   �X      m          0    9873382    telemetry_instancetelemetry 
   TABLE DATA           R   COPY public.telemetry_instancetelemetry (id, instance_id, created_at) FROM stdin;
    public          taiga    false    329   Y      -          0    9872275    timeline_timeline 
   TABLE DATA           �   COPY public.timeline_timeline (id, object_id, namespace, event_type, project_id, data, data_content_type_id, created, content_type_id) FROM stdin;
    public          taiga    false    265   Y      q          0    9873423    token_denylist_denylistedtoken 
   TABLE DATA           U   COPY public.token_denylist_denylistedtoken (id, denylisted_at, token_id) FROM stdin;
    public          taiga    false    333   j      o          0    9873410    token_denylist_outstandingtoken 
   TABLE DATA           j   COPY public.token_denylist_outstandingtoken (id, jti, token, created_at, expires_at, user_id) FROM stdin;
    public          taiga    false    331   -j      )          0    9872176    users_authdata 
   TABLE DATA           H   COPY public.users_authdata (id, key, value, extra, user_id) FROM stdin;
    public          taiga    false    261   Jj      �          0    9871333 
   users_role 
   TABLE DATA           l   COPY public.users_role (id, name, slug, permissions, "order", computable, project_id, is_admin) FROM stdin;
    public          taiga    false    211   gj      �          0    9871295 
   users_user 
   TABLE DATA           �  COPY public.users_user (id, password, last_login, is_superuser, username, email, is_active, full_name, color, bio, photo, date_joined, lang, timezone, colorize_tags, token, email_token, new_email, is_system, theme, max_private_projects, max_public_projects, max_memberships_private_projects, max_memberships_public_projects, uuid, accepted_terms, read_new_terms, verified_email, is_staff, date_cancelled) FROM stdin;
    public          taiga    false    207   Xl      s          0    9873467    users_workspacerole 
   TABLE DATA           k   COPY public.users_workspacerole (id, name, slug, permissions, "order", is_admin, workspace_id) FROM stdin;
    public          taiga    false    335   ^s      u          0    9873488    userstorage_storageentry 
   TABLE DATA           i   COPY public.userstorage_storageentry (id, created_date, modified_date, key, value, owner_id) FROM stdin;
    public          taiga    false    337   �t                0    9871820    userstories_rolepoints 
   TABLE DATA           W   COPY public.userstories_rolepoints (id, points_id, role_id, user_story_id) FROM stdin;
    public          taiga    false    245   �t                0    9871828    userstories_userstory 
   TABLE DATA           �  COPY public.userstories_userstory (id, tags, version, is_blocked, blocked_note, ref, is_closed, backlog_order, created_date, modified_date, finish_date, subject, description, client_requirement, team_requirement, assigned_to_id, generated_from_issue_id, milestone_id, owner_id, project_id, status_id, sprint_order, kanban_order, external_reference, tribe_gig, due_date, due_date_reason, generated_from_task_id, from_task_ref, swimlane_id) FROM stdin;
    public          taiga    false    247   u      w          0    9873559 $   userstories_userstory_assigned_users 
   TABLE DATA           Y   COPY public.userstories_userstory_assigned_users (id, userstory_id, user_id) FROM stdin;
    public          taiga    false    339   %u      y          0    9873598 
   votes_vote 
   TABLE DATA           [   COPY public.votes_vote (id, object_id, content_type_id, user_id, created_date) FROM stdin;
    public          taiga    false    341   Bu      {          0    9873607    votes_votes 
   TABLE DATA           L   COPY public.votes_votes (id, object_id, count, content_type_id) FROM stdin;
    public          taiga    false    343   _u      }          0    9873645    webhooks_webhook 
   TABLE DATA           J   COPY public.webhooks_webhook (id, url, key, project_id, name) FROM stdin;
    public          taiga    false    345   |u                0    9873656    webhooks_webhooklog 
   TABLE DATA           �   COPY public.webhooks_webhooklog (id, url, status, request_data, response_data, webhook_id, created, duration, request_headers, response_headers) FROM stdin;
    public          taiga    false    347   �u      5          0    9872534    wiki_wikilink 
   TABLE DATA           M   COPY public.wiki_wikilink (id, title, href, "order", project_id) FROM stdin;
    public          taiga    false    273   �u      7          0    9872546    wiki_wikipage 
   TABLE DATA           �   COPY public.wiki_wikipage (id, version, slug, content, created_date, modified_date, last_modifier_id, owner_id, project_id) FROM stdin;
    public          taiga    false    275   �u      \          0    9873159    workspaces_workspace 
   TABLE DATA           x   COPY public.workspaces_workspace (id, name, slug, color, created_date, modified_date, owner_id, is_premium) FROM stdin;
    public          taiga    false    312   �u      �          0    9873703    workspaces_workspacemembership 
   TABLE DATA           f   COPY public.workspaces_workspacemembership (id, user_id, workspace_id, workspace_role_id) FROM stdin;
    public          taiga    false    349   �y      �           0    0    attachments_attachment_id_seq    SEQUENCE SET     L   SELECT pg_catalog.setval('public.attachments_attachment_id_seq', 1, false);
          public          taiga    false    232            �           0    0    auth_group_id_seq    SEQUENCE SET     @   SELECT pg_catalog.setval('public.auth_group_id_seq', 1, false);
          public          taiga    false    236            �           0    0    auth_group_permissions_id_seq    SEQUENCE SET     L   SELECT pg_catalog.setval('public.auth_group_permissions_id_seq', 1, false);
          public          taiga    false    238            �           0    0    auth_permission_id_seq    SEQUENCE SET     F   SELECT pg_catalog.setval('public.auth_permission_id_seq', 284, true);
          public          taiga    false    234            �           0    0    contact_contactentry_id_seq    SEQUENCE SET     J   SELECT pg_catalog.setval('public.contact_contactentry_id_seq', 1, false);
          public          taiga    false    270            �           0    0 ,   custom_attributes_epiccustomattribute_id_seq    SEQUENCE SET     [   SELECT pg_catalog.setval('public.custom_attributes_epiccustomattribute_id_seq', 1, false);
          public          taiga    false    293            �           0    0 3   custom_attributes_epiccustomattributesvalues_id_seq    SEQUENCE SET     b   SELECT pg_catalog.setval('public.custom_attributes_epiccustomattributesvalues_id_seq', 1, false);
          public          taiga    false    295            �           0    0 -   custom_attributes_issuecustomattribute_id_seq    SEQUENCE SET     \   SELECT pg_catalog.setval('public.custom_attributes_issuecustomattribute_id_seq', 1, false);
          public          taiga    false    281            �           0    0 4   custom_attributes_issuecustomattributesvalues_id_seq    SEQUENCE SET     c   SELECT pg_catalog.setval('public.custom_attributes_issuecustomattributesvalues_id_seq', 1, false);
          public          taiga    false    287            �           0    0 ,   custom_attributes_taskcustomattribute_id_seq    SEQUENCE SET     [   SELECT pg_catalog.setval('public.custom_attributes_taskcustomattribute_id_seq', 1, false);
          public          taiga    false    283            �           0    0 3   custom_attributes_taskcustomattributesvalues_id_seq    SEQUENCE SET     b   SELECT pg_catalog.setval('public.custom_attributes_taskcustomattributesvalues_id_seq', 1, false);
          public          taiga    false    289            �           0    0 1   custom_attributes_userstorycustomattribute_id_seq    SEQUENCE SET     `   SELECT pg_catalog.setval('public.custom_attributes_userstorycustomattribute_id_seq', 1, false);
          public          taiga    false    285            �           0    0 8   custom_attributes_userstorycustomattributesvalues_id_seq    SEQUENCE SET     g   SELECT pg_catalog.setval('public.custom_attributes_userstorycustomattributesvalues_id_seq', 1, false);
          public          taiga    false    291            �           0    0    django_admin_log_id_seq    SEQUENCE SET     F   SELECT pg_catalog.setval('public.django_admin_log_id_seq', 1, false);
          public          taiga    false    208            �           0    0    django_content_type_id_seq    SEQUENCE SET     I   SELECT pg_catalog.setval('public.django_content_type_id_seq', 71, true);
          public          taiga    false    204            �           0    0    django_migrations_id_seq    SEQUENCE SET     H   SELECT pg_catalog.setval('public.django_migrations_id_seq', 278, true);
          public          taiga    false    202            �           0    0    easy_thumbnails_source_id_seq    SEQUENCE SET     L   SELECT pg_catalog.setval('public.easy_thumbnails_source_id_seq', 1, false);
          public          taiga    false    298            �           0    0     easy_thumbnails_thumbnail_id_seq    SEQUENCE SET     O   SELECT pg_catalog.setval('public.easy_thumbnails_thumbnail_id_seq', 1, false);
          public          taiga    false    300            �           0    0 *   easy_thumbnails_thumbnaildimensions_id_seq    SEQUENCE SET     Y   SELECT pg_catalog.setval('public.easy_thumbnails_thumbnaildimensions_id_seq', 1, false);
          public          taiga    false    302            �           0    0    epics_epic_id_seq    SEQUENCE SET     @   SELECT pg_catalog.setval('public.epics_epic_id_seq', 1, false);
          public          taiga    false    277            �           0    0    epics_relateduserstory_id_seq    SEQUENCE SET     L   SELECT pg_catalog.setval('public.epics_relateduserstory_id_seq', 1, false);
          public          taiga    false    279            �           0    0 %   external_apps_applicationtoken_id_seq    SEQUENCE SET     T   SELECT pg_catalog.setval('public.external_apps_applicationtoken_id_seq', 1, false);
          public          taiga    false    305            �           0    0    feedback_feedbackentry_id_seq    SEQUENCE SET     L   SELECT pg_catalog.setval('public.feedback_feedbackentry_id_seq', 1, false);
          public          taiga    false    307            �           0    0    issues_issue_id_seq    SEQUENCE SET     B   SELECT pg_catalog.setval('public.issues_issue_id_seq', 1, false);
          public          taiga    false    242                        0    0    likes_like_id_seq    SEQUENCE SET     @   SELECT pg_catalog.setval('public.likes_like_id_seq', 1, false);
          public          taiga    false    266                       0    0    milestones_milestone_id_seq    SEQUENCE SET     J   SELECT pg_catalog.setval('public.milestones_milestone_id_seq', 1, false);
          public          taiga    false    240                       0    0 >   notifications_historychangenotification_history_entries_id_seq    SEQUENCE SET     m   SELECT pg_catalog.setval('public.notifications_historychangenotification_history_entries_id_seq', 1, false);
          public          taiga    false    252                       0    0 .   notifications_historychangenotification_id_seq    SEQUENCE SET     ]   SELECT pg_catalog.setval('public.notifications_historychangenotification_id_seq', 1, false);
          public          taiga    false    250                       0    0 ;   notifications_historychangenotification_notify_users_id_seq    SEQUENCE SET     j   SELECT pg_catalog.setval('public.notifications_historychangenotification_notify_users_id_seq', 1, false);
          public          taiga    false    254                       0    0 !   notifications_notifypolicy_id_seq    SEQUENCE SET     Q   SELECT pg_catalog.setval('public.notifications_notifypolicy_id_seq', 124, true);
          public          taiga    false    248                       0    0    notifications_watched_id_seq    SEQUENCE SET     K   SELECT pg_catalog.setval('public.notifications_watched_id_seq', 1, false);
          public          taiga    false    256                       0    0 $   notifications_webnotification_id_seq    SEQUENCE SET     S   SELECT pg_catalog.setval('public.notifications_webnotification_id_seq', 1, false);
          public          taiga    false    309                       0    0    projects_epicstatus_id_seq    SEQUENCE SET     J   SELECT pg_catalog.setval('public.projects_epicstatus_id_seq', 120, true);
          public          taiga    false    268            	           0    0    projects_issueduedate_id_seq    SEQUENCE SET     K   SELECT pg_catalog.setval('public.projects_issueduedate_id_seq', 72, true);
          public          taiga    false    313            
           0    0    projects_issuestatus_id_seq    SEQUENCE SET     K   SELECT pg_catalog.setval('public.projects_issuestatus_id_seq', 168, true);
          public          taiga    false    216                       0    0    projects_issuetype_id_seq    SEQUENCE SET     H   SELECT pg_catalog.setval('public.projects_issuetype_id_seq', 72, true);
          public          taiga    false    218                       0    0    projects_membership_id_seq    SEQUENCE SET     J   SELECT pg_catalog.setval('public.projects_membership_id_seq', 124, true);
          public          taiga    false    212                       0    0    projects_points_id_seq    SEQUENCE SET     F   SELECT pg_catalog.setval('public.projects_points_id_seq', 288, true);
          public          taiga    false    220                       0    0    projects_priority_id_seq    SEQUENCE SET     G   SELECT pg_catalog.setval('public.projects_priority_id_seq', 72, true);
          public          taiga    false    222                       0    0    projects_project_id_seq    SEQUENCE SET     F   SELECT pg_catalog.setval('public.projects_project_id_seq', 24, true);
          public          taiga    false    214                       0    0 $   projects_projectmodulesconfig_id_seq    SEQUENCE SET     S   SELECT pg_catalog.setval('public.projects_projectmodulesconfig_id_seq', 1, false);
          public          taiga    false    262                       0    0    projects_projecttemplate_id_seq    SEQUENCE SET     M   SELECT pg_catalog.setval('public.projects_projecttemplate_id_seq', 2, true);
          public          taiga    false    224                       0    0    projects_severity_id_seq    SEQUENCE SET     H   SELECT pg_catalog.setval('public.projects_severity_id_seq', 120, true);
          public          taiga    false    226                       0    0    projects_swimlane_id_seq    SEQUENCE SET     G   SELECT pg_catalog.setval('public.projects_swimlane_id_seq', 1, false);
          public          taiga    false    319                       0    0 '   projects_swimlaneuserstorystatus_id_seq    SEQUENCE SET     V   SELECT pg_catalog.setval('public.projects_swimlaneuserstorystatus_id_seq', 1, false);
          public          taiga    false    321                       0    0    projects_taskduedate_id_seq    SEQUENCE SET     J   SELECT pg_catalog.setval('public.projects_taskduedate_id_seq', 72, true);
          public          taiga    false    315                       0    0    projects_taskstatus_id_seq    SEQUENCE SET     J   SELECT pg_catalog.setval('public.projects_taskstatus_id_seq', 120, true);
          public          taiga    false    228                       0    0     projects_userstoryduedate_id_seq    SEQUENCE SET     O   SELECT pg_catalog.setval('public.projects_userstoryduedate_id_seq', 72, true);
          public          taiga    false    317                       0    0    projects_userstorystatus_id_seq    SEQUENCE SET     O   SELECT pg_catalog.setval('public.projects_userstorystatus_id_seq', 144, true);
          public          taiga    false    230                       0    0    references_project1    SEQUENCE SET     B   SELECT pg_catalog.setval('public.references_project1', 1, false);
          public          taiga    false    350                       0    0    references_project10    SEQUENCE SET     C   SELECT pg_catalog.setval('public.references_project10', 1, false);
          public          taiga    false    359                       0    0    references_project11    SEQUENCE SET     C   SELECT pg_catalog.setval('public.references_project11', 1, false);
          public          taiga    false    360                       0    0    references_project12    SEQUENCE SET     C   SELECT pg_catalog.setval('public.references_project12', 1, false);
          public          taiga    false    361                       0    0    references_project13    SEQUENCE SET     C   SELECT pg_catalog.setval('public.references_project13', 1, false);
          public          taiga    false    362                       0    0    references_project14    SEQUENCE SET     C   SELECT pg_catalog.setval('public.references_project14', 1, false);
          public          taiga    false    363                       0    0    references_project15    SEQUENCE SET     C   SELECT pg_catalog.setval('public.references_project15', 1, false);
          public          taiga    false    364                        0    0    references_project16    SEQUENCE SET     C   SELECT pg_catalog.setval('public.references_project16', 1, false);
          public          taiga    false    365            !           0    0    references_project17    SEQUENCE SET     C   SELECT pg_catalog.setval('public.references_project17', 1, false);
          public          taiga    false    366            "           0    0    references_project18    SEQUENCE SET     C   SELECT pg_catalog.setval('public.references_project18', 1, false);
          public          taiga    false    367            #           0    0    references_project19    SEQUENCE SET     C   SELECT pg_catalog.setval('public.references_project19', 1, false);
          public          taiga    false    368            $           0    0    references_project2    SEQUENCE SET     B   SELECT pg_catalog.setval('public.references_project2', 1, false);
          public          taiga    false    351            %           0    0    references_project20    SEQUENCE SET     C   SELECT pg_catalog.setval('public.references_project20', 1, false);
          public          taiga    false    369            &           0    0    references_project21    SEQUENCE SET     C   SELECT pg_catalog.setval('public.references_project21', 1, false);
          public          taiga    false    370            '           0    0    references_project22    SEQUENCE SET     C   SELECT pg_catalog.setval('public.references_project22', 1, false);
          public          taiga    false    371            (           0    0    references_project23    SEQUENCE SET     C   SELECT pg_catalog.setval('public.references_project23', 1, false);
          public          taiga    false    372            )           0    0    references_project24    SEQUENCE SET     C   SELECT pg_catalog.setval('public.references_project24', 1, false);
          public          taiga    false    373            *           0    0    references_project3    SEQUENCE SET     B   SELECT pg_catalog.setval('public.references_project3', 1, false);
          public          taiga    false    352            +           0    0    references_project4    SEQUENCE SET     B   SELECT pg_catalog.setval('public.references_project4', 1, false);
          public          taiga    false    353            ,           0    0    references_project5    SEQUENCE SET     B   SELECT pg_catalog.setval('public.references_project5', 1, false);
          public          taiga    false    354            -           0    0    references_project6    SEQUENCE SET     B   SELECT pg_catalog.setval('public.references_project6', 1, false);
          public          taiga    false    355            .           0    0    references_project7    SEQUENCE SET     B   SELECT pg_catalog.setval('public.references_project7', 1, false);
          public          taiga    false    356            /           0    0    references_project8    SEQUENCE SET     B   SELECT pg_catalog.setval('public.references_project8', 1, false);
          public          taiga    false    357            0           0    0    references_project9    SEQUENCE SET     B   SELECT pg_catalog.setval('public.references_project9', 1, false);
          public          taiga    false    358            1           0    0    references_reference_id_seq    SEQUENCE SET     J   SELECT pg_catalog.setval('public.references_reference_id_seq', 1, false);
          public          taiga    false    323            2           0    0 #   settings_userprojectsettings_id_seq    SEQUENCE SET     R   SELECT pg_catalog.setval('public.settings_userprojectsettings_id_seq', 1, false);
          public          taiga    false    326            3           0    0    tasks_task_id_seq    SEQUENCE SET     @   SELECT pg_catalog.setval('public.tasks_task_id_seq', 1, false);
          public          taiga    false    258            4           0    0 "   telemetry_instancetelemetry_id_seq    SEQUENCE SET     Q   SELECT pg_catalog.setval('public.telemetry_instancetelemetry_id_seq', 1, false);
          public          taiga    false    328            5           0    0    timeline_timeline_id_seq    SEQUENCE SET     H   SELECT pg_catalog.setval('public.timeline_timeline_id_seq', 211, true);
          public          taiga    false    264            6           0    0 %   token_denylist_denylistedtoken_id_seq    SEQUENCE SET     T   SELECT pg_catalog.setval('public.token_denylist_denylistedtoken_id_seq', 1, false);
          public          taiga    false    332            7           0    0 &   token_denylist_outstandingtoken_id_seq    SEQUENCE SET     U   SELECT pg_catalog.setval('public.token_denylist_outstandingtoken_id_seq', 1, false);
          public          taiga    false    330            8           0    0    users_authdata_id_seq    SEQUENCE SET     D   SELECT pg_catalog.setval('public.users_authdata_id_seq', 1, false);
          public          taiga    false    260            9           0    0    users_role_id_seq    SEQUENCE SET     @   SELECT pg_catalog.setval('public.users_role_id_seq', 51, true);
          public          taiga    false    210            :           0    0    users_user_id_seq    SEQUENCE SET     @   SELECT pg_catalog.setval('public.users_user_id_seq', 15, true);
          public          taiga    false    206            ;           0    0    users_workspacerole_id_seq    SEQUENCE SET     I   SELECT pg_catalog.setval('public.users_workspacerole_id_seq', 31, true);
          public          taiga    false    334            <           0    0    userstorage_storageentry_id_seq    SEQUENCE SET     N   SELECT pg_catalog.setval('public.userstorage_storageentry_id_seq', 1, false);
          public          taiga    false    336            =           0    0    userstories_rolepoints_id_seq    SEQUENCE SET     L   SELECT pg_catalog.setval('public.userstories_rolepoints_id_seq', 1, false);
          public          taiga    false    244            >           0    0 +   userstories_userstory_assigned_users_id_seq    SEQUENCE SET     Z   SELECT pg_catalog.setval('public.userstories_userstory_assigned_users_id_seq', 1, false);
          public          taiga    false    338            ?           0    0    userstories_userstory_id_seq    SEQUENCE SET     K   SELECT pg_catalog.setval('public.userstories_userstory_id_seq', 1, false);
          public          taiga    false    246            @           0    0    votes_vote_id_seq    SEQUENCE SET     @   SELECT pg_catalog.setval('public.votes_vote_id_seq', 1, false);
          public          taiga    false    340            A           0    0    votes_votes_id_seq    SEQUENCE SET     A   SELECT pg_catalog.setval('public.votes_votes_id_seq', 1, false);
          public          taiga    false    342            B           0    0    webhooks_webhook_id_seq    SEQUENCE SET     F   SELECT pg_catalog.setval('public.webhooks_webhook_id_seq', 1, false);
          public          taiga    false    344            C           0    0    webhooks_webhooklog_id_seq    SEQUENCE SET     I   SELECT pg_catalog.setval('public.webhooks_webhooklog_id_seq', 1, false);
          public          taiga    false    346            D           0    0    wiki_wikilink_id_seq    SEQUENCE SET     C   SELECT pg_catalog.setval('public.wiki_wikilink_id_seq', 1, false);
          public          taiga    false    272            E           0    0    wiki_wikipage_id_seq    SEQUENCE SET     C   SELECT pg_catalog.setval('public.wiki_wikipage_id_seq', 1, false);
          public          taiga    false    274            F           0    0    workspaces_workspace_id_seq    SEQUENCE SET     J   SELECT pg_catalog.setval('public.workspaces_workspace_id_seq', 21, true);
          public          taiga    false    311            G           0    0 %   workspaces_workspacemembership_id_seq    SEQUENCE SET     T   SELECT pg_catalog.setval('public.workspaces_workspacemembership_id_seq', 88, true);
          public          taiga    false    348            {           2606    9871589 2   attachments_attachment attachments_attachment_pkey 
   CONSTRAINT     p   ALTER TABLE ONLY public.attachments_attachment
    ADD CONSTRAINT attachments_attachment_pkey PRIMARY KEY (id);
 \   ALTER TABLE ONLY public.attachments_attachment DROP CONSTRAINT attachments_attachment_pkey;
       public            taiga    false    233            �           2606    9871667    auth_group auth_group_name_key 
   CONSTRAINT     Y   ALTER TABLE ONLY public.auth_group
    ADD CONSTRAINT auth_group_name_key UNIQUE (name);
 H   ALTER TABLE ONLY public.auth_group DROP CONSTRAINT auth_group_name_key;
       public            taiga    false    237            �           2606    9871663 R   auth_group_permissions auth_group_permissions_group_id_permission_id_0cd325b0_uniq 
   CONSTRAINT     �   ALTER TABLE ONLY public.auth_group_permissions
    ADD CONSTRAINT auth_group_permissions_group_id_permission_id_0cd325b0_uniq UNIQUE (group_id, permission_id);
 |   ALTER TABLE ONLY public.auth_group_permissions DROP CONSTRAINT auth_group_permissions_group_id_permission_id_0cd325b0_uniq;
       public            taiga    false    239    239            �           2606    9871642 2   auth_group_permissions auth_group_permissions_pkey 
   CONSTRAINT     p   ALTER TABLE ONLY public.auth_group_permissions
    ADD CONSTRAINT auth_group_permissions_pkey PRIMARY KEY (id);
 \   ALTER TABLE ONLY public.auth_group_permissions DROP CONSTRAINT auth_group_permissions_pkey;
       public            taiga    false    239            �           2606    9871632    auth_group auth_group_pkey 
   CONSTRAINT     X   ALTER TABLE ONLY public.auth_group
    ADD CONSTRAINT auth_group_pkey PRIMARY KEY (id);
 D   ALTER TABLE ONLY public.auth_group DROP CONSTRAINT auth_group_pkey;
       public            taiga    false    237                       2606    9871649 F   auth_permission auth_permission_content_type_id_codename_01ab375a_uniq 
   CONSTRAINT     �   ALTER TABLE ONLY public.auth_permission
    ADD CONSTRAINT auth_permission_content_type_id_codename_01ab375a_uniq UNIQUE (content_type_id, codename);
 p   ALTER TABLE ONLY public.auth_permission DROP CONSTRAINT auth_permission_content_type_id_codename_01ab375a_uniq;
       public            taiga    false    235    235            �           2606    9871624 $   auth_permission auth_permission_pkey 
   CONSTRAINT     b   ALTER TABLE ONLY public.auth_permission
    ADD CONSTRAINT auth_permission_pkey PRIMARY KEY (id);
 N   ALTER TABLE ONLY public.auth_permission DROP CONSTRAINT auth_permission_pkey;
       public            taiga    false    235                       2606    9872519 .   contact_contactentry contact_contactentry_pkey 
   CONSTRAINT     l   ALTER TABLE ONLY public.contact_contactentry
    ADD CONSTRAINT contact_contactentry_pkey PRIMARY KEY (id);
 X   ALTER TABLE ONLY public.contact_contactentry DROP CONSTRAINT contact_contactentry_pkey;
       public            taiga    false    271            K           2606    9872871 \   custom_attributes_epiccustomattribute custom_attributes_epiccu_project_id_name_3850c31d_uniq 
   CONSTRAINT     �   ALTER TABLE ONLY public.custom_attributes_epiccustomattribute
    ADD CONSTRAINT custom_attributes_epiccu_project_id_name_3850c31d_uniq UNIQUE (project_id, name);
 �   ALTER TABLE ONLY public.custom_attributes_epiccustomattribute DROP CONSTRAINT custom_attributes_epiccu_project_id_name_3850c31d_uniq;
       public            taiga    false    294    294            M           2606    9872855 P   custom_attributes_epiccustomattribute custom_attributes_epiccustomattribute_pkey 
   CONSTRAINT     �   ALTER TABLE ONLY public.custom_attributes_epiccustomattribute
    ADD CONSTRAINT custom_attributes_epiccustomattribute_pkey PRIMARY KEY (id);
 z   ALTER TABLE ONLY public.custom_attributes_epiccustomattribute DROP CONSTRAINT custom_attributes_epiccustomattribute_pkey;
       public            taiga    false    294            Q           2606    9872868 e   custom_attributes_epiccustomattributesvalues custom_attributes_epiccustomattributesvalues_epic_id_key 
   CONSTRAINT     �   ALTER TABLE ONLY public.custom_attributes_epiccustomattributesvalues
    ADD CONSTRAINT custom_attributes_epiccustomattributesvalues_epic_id_key UNIQUE (epic_id);
 �   ALTER TABLE ONLY public.custom_attributes_epiccustomattributesvalues DROP CONSTRAINT custom_attributes_epiccustomattributesvalues_epic_id_key;
       public            taiga    false    296            S           2606    9872866 ^   custom_attributes_epiccustomattributesvalues custom_attributes_epiccustomattributesvalues_pkey 
   CONSTRAINT     �   ALTER TABLE ONLY public.custom_attributes_epiccustomattributesvalues
    ADD CONSTRAINT custom_attributes_epiccustomattributesvalues_pkey PRIMARY KEY (id);
 �   ALTER TABLE ONLY public.custom_attributes_epiccustomattributesvalues DROP CONSTRAINT custom_attributes_epiccustomattributesvalues_pkey;
       public            taiga    false    296            -           2606    9872758 ]   custom_attributes_issuecustomattribute custom_attributes_issuec_project_id_name_6f71f010_uniq 
   CONSTRAINT     �   ALTER TABLE ONLY public.custom_attributes_issuecustomattribute
    ADD CONSTRAINT custom_attributes_issuec_project_id_name_6f71f010_uniq UNIQUE (project_id, name);
 �   ALTER TABLE ONLY public.custom_attributes_issuecustomattribute DROP CONSTRAINT custom_attributes_issuec_project_id_name_6f71f010_uniq;
       public            taiga    false    282    282            /           2606    9872730 R   custom_attributes_issuecustomattribute custom_attributes_issuecustomattribute_pkey 
   CONSTRAINT     �   ALTER TABLE ONLY public.custom_attributes_issuecustomattribute
    ADD CONSTRAINT custom_attributes_issuecustomattribute_pkey PRIMARY KEY (id);
 |   ALTER TABLE ONLY public.custom_attributes_issuecustomattribute DROP CONSTRAINT custom_attributes_issuecustomattribute_pkey;
       public            taiga    false    282            =           2606    9872789 h   custom_attributes_issuecustomattributesvalues custom_attributes_issuecustomattributesvalues_issue_id_key 
   CONSTRAINT     �   ALTER TABLE ONLY public.custom_attributes_issuecustomattributesvalues
    ADD CONSTRAINT custom_attributes_issuecustomattributesvalues_issue_id_key UNIQUE (issue_id);
 �   ALTER TABLE ONLY public.custom_attributes_issuecustomattributesvalues DROP CONSTRAINT custom_attributes_issuecustomattributesvalues_issue_id_key;
       public            taiga    false    288            ?           2606    9872787 `   custom_attributes_issuecustomattributesvalues custom_attributes_issuecustomattributesvalues_pkey 
   CONSTRAINT     �   ALTER TABLE ONLY public.custom_attributes_issuecustomattributesvalues
    ADD CONSTRAINT custom_attributes_issuecustomattributesvalues_pkey PRIMARY KEY (id);
 �   ALTER TABLE ONLY public.custom_attributes_issuecustomattributesvalues DROP CONSTRAINT custom_attributes_issuecustomattributesvalues_pkey;
       public            taiga    false    288            2           2606    9872756 \   custom_attributes_taskcustomattribute custom_attributes_taskcu_project_id_name_c1c55ac2_uniq 
   CONSTRAINT     �   ALTER TABLE ONLY public.custom_attributes_taskcustomattribute
    ADD CONSTRAINT custom_attributes_taskcu_project_id_name_c1c55ac2_uniq UNIQUE (project_id, name);
 �   ALTER TABLE ONLY public.custom_attributes_taskcustomattribute DROP CONSTRAINT custom_attributes_taskcu_project_id_name_c1c55ac2_uniq;
       public            taiga    false    284    284            4           2606    9872741 P   custom_attributes_taskcustomattribute custom_attributes_taskcustomattribute_pkey 
   CONSTRAINT     �   ALTER TABLE ONLY public.custom_attributes_taskcustomattribute
    ADD CONSTRAINT custom_attributes_taskcustomattribute_pkey PRIMARY KEY (id);
 z   ALTER TABLE ONLY public.custom_attributes_taskcustomattribute DROP CONSTRAINT custom_attributes_taskcustomattribute_pkey;
       public            taiga    false    284            B           2606    9872800 ^   custom_attributes_taskcustomattributesvalues custom_attributes_taskcustomattributesvalues_pkey 
   CONSTRAINT     �   ALTER TABLE ONLY public.custom_attributes_taskcustomattributesvalues
    ADD CONSTRAINT custom_attributes_taskcustomattributesvalues_pkey PRIMARY KEY (id);
 �   ALTER TABLE ONLY public.custom_attributes_taskcustomattributesvalues DROP CONSTRAINT custom_attributes_taskcustomattributesvalues_pkey;
       public            taiga    false    290            D           2606    9872802 e   custom_attributes_taskcustomattributesvalues custom_attributes_taskcustomattributesvalues_task_id_key 
   CONSTRAINT     �   ALTER TABLE ONLY public.custom_attributes_taskcustomattributesvalues
    ADD CONSTRAINT custom_attributes_taskcustomattributesvalues_task_id_key UNIQUE (task_id);
 �   ALTER TABLE ONLY public.custom_attributes_taskcustomattributesvalues DROP CONSTRAINT custom_attributes_taskcustomattributesvalues_task_id_key;
       public            taiga    false    290            7           2606    9872754 a   custom_attributes_userstorycustomattribute custom_attributes_userst_project_id_name_86c6b502_uniq 
   CONSTRAINT     �   ALTER TABLE ONLY public.custom_attributes_userstorycustomattribute
    ADD CONSTRAINT custom_attributes_userst_project_id_name_86c6b502_uniq UNIQUE (project_id, name);
 �   ALTER TABLE ONLY public.custom_attributes_userstorycustomattribute DROP CONSTRAINT custom_attributes_userst_project_id_name_86c6b502_uniq;
       public            taiga    false    286    286            9           2606    9872752 Z   custom_attributes_userstorycustomattribute custom_attributes_userstorycustomattribute_pkey 
   CONSTRAINT     �   ALTER TABLE ONLY public.custom_attributes_userstorycustomattribute
    ADD CONSTRAINT custom_attributes_userstorycustomattribute_pkey PRIMARY KEY (id);
 �   ALTER TABLE ONLY public.custom_attributes_userstorycustomattribute DROP CONSTRAINT custom_attributes_userstorycustomattribute_pkey;
       public            taiga    false    286            G           2606    9872815 q   custom_attributes_userstorycustomattributesvalues custom_attributes_userstorycustomattributesva_user_story_id_key 
   CONSTRAINT     �   ALTER TABLE ONLY public.custom_attributes_userstorycustomattributesvalues
    ADD CONSTRAINT custom_attributes_userstorycustomattributesva_user_story_id_key UNIQUE (user_story_id);
 �   ALTER TABLE ONLY public.custom_attributes_userstorycustomattributesvalues DROP CONSTRAINT custom_attributes_userstorycustomattributesva_user_story_id_key;
       public            taiga    false    292            I           2606    9872813 h   custom_attributes_userstorycustomattributesvalues custom_attributes_userstorycustomattributesvalues_pkey 
   CONSTRAINT     �   ALTER TABLE ONLY public.custom_attributes_userstorycustomattributesvalues
    ADD CONSTRAINT custom_attributes_userstorycustomattributesvalues_pkey PRIMARY KEY (id);
 �   ALTER TABLE ONLY public.custom_attributes_userstorycustomattributesvalues DROP CONSTRAINT custom_attributes_userstorycustomattributesvalues_pkey;
       public            taiga    false    292                       2606    9871318 &   django_admin_log django_admin_log_pkey 
   CONSTRAINT     d   ALTER TABLE ONLY public.django_admin_log
    ADD CONSTRAINT django_admin_log_pkey PRIMARY KEY (id);
 P   ALTER TABLE ONLY public.django_admin_log DROP CONSTRAINT django_admin_log_pkey;
       public            taiga    false    209            �           2606    9871292 E   django_content_type django_content_type_app_label_model_76bd3d3b_uniq 
   CONSTRAINT     �   ALTER TABLE ONLY public.django_content_type
    ADD CONSTRAINT django_content_type_app_label_model_76bd3d3b_uniq UNIQUE (app_label, model);
 o   ALTER TABLE ONLY public.django_content_type DROP CONSTRAINT django_content_type_app_label_model_76bd3d3b_uniq;
       public            taiga    false    205    205            �           2606    9871290 ,   django_content_type django_content_type_pkey 
   CONSTRAINT     j   ALTER TABLE ONLY public.django_content_type
    ADD CONSTRAINT django_content_type_pkey PRIMARY KEY (id);
 V   ALTER TABLE ONLY public.django_content_type DROP CONSTRAINT django_content_type_pkey;
       public            taiga    false    205            �           2606    9871282 (   django_migrations django_migrations_pkey 
   CONSTRAINT     f   ALTER TABLE ONLY public.django_migrations
    ADD CONSTRAINT django_migrations_pkey PRIMARY KEY (id);
 R   ALTER TABLE ONLY public.django_migrations DROP CONSTRAINT django_migrations_pkey;
       public            taiga    false    203            �           2606    9873321 "   django_session django_session_pkey 
   CONSTRAINT     i   ALTER TABLE ONLY public.django_session
    ADD CONSTRAINT django_session_pkey PRIMARY KEY (session_key);
 L   ALTER TABLE ONLY public.django_session DROP CONSTRAINT django_session_pkey;
       public            taiga    false    325            U           2606    9872964 "   djmail_message djmail_message_pkey 
   CONSTRAINT     b   ALTER TABLE ONLY public.djmail_message
    ADD CONSTRAINT djmail_message_pkey PRIMARY KEY (uuid);
 L   ALTER TABLE ONLY public.djmail_message DROP CONSTRAINT djmail_message_pkey;
       public            taiga    false    297            Z           2606    9872973 2   easy_thumbnails_source easy_thumbnails_source_pkey 
   CONSTRAINT     p   ALTER TABLE ONLY public.easy_thumbnails_source
    ADD CONSTRAINT easy_thumbnails_source_pkey PRIMARY KEY (id);
 \   ALTER TABLE ONLY public.easy_thumbnails_source DROP CONSTRAINT easy_thumbnails_source_pkey;
       public            taiga    false    299            ^           2606    9872985 M   easy_thumbnails_source easy_thumbnails_source_storage_hash_name_481ce32d_uniq 
   CONSTRAINT     �   ALTER TABLE ONLY public.easy_thumbnails_source
    ADD CONSTRAINT easy_thumbnails_source_storage_hash_name_481ce32d_uniq UNIQUE (storage_hash, name);
 w   ALTER TABLE ONLY public.easy_thumbnails_source DROP CONSTRAINT easy_thumbnails_source_storage_hash_name_481ce32d_uniq;
       public            taiga    false    299    299            `           2606    9872983 Y   easy_thumbnails_thumbnail easy_thumbnails_thumbnai_storage_hash_name_source_fb375270_uniq 
   CONSTRAINT     �   ALTER TABLE ONLY public.easy_thumbnails_thumbnail
    ADD CONSTRAINT easy_thumbnails_thumbnai_storage_hash_name_source_fb375270_uniq UNIQUE (storage_hash, name, source_id);
 �   ALTER TABLE ONLY public.easy_thumbnails_thumbnail DROP CONSTRAINT easy_thumbnails_thumbnai_storage_hash_name_source_fb375270_uniq;
       public            taiga    false    301    301    301            d           2606    9872981 8   easy_thumbnails_thumbnail easy_thumbnails_thumbnail_pkey 
   CONSTRAINT     v   ALTER TABLE ONLY public.easy_thumbnails_thumbnail
    ADD CONSTRAINT easy_thumbnails_thumbnail_pkey PRIMARY KEY (id);
 b   ALTER TABLE ONLY public.easy_thumbnails_thumbnail DROP CONSTRAINT easy_thumbnails_thumbnail_pkey;
       public            taiga    false    301            i           2606    9873009 L   easy_thumbnails_thumbnaildimensions easy_thumbnails_thumbnaildimensions_pkey 
   CONSTRAINT     �   ALTER TABLE ONLY public.easy_thumbnails_thumbnaildimensions
    ADD CONSTRAINT easy_thumbnails_thumbnaildimensions_pkey PRIMARY KEY (id);
 v   ALTER TABLE ONLY public.easy_thumbnails_thumbnaildimensions DROP CONSTRAINT easy_thumbnails_thumbnaildimensions_pkey;
       public            taiga    false    303            k           2606    9873011 X   easy_thumbnails_thumbnaildimensions easy_thumbnails_thumbnaildimensions_thumbnail_id_key 
   CONSTRAINT     �   ALTER TABLE ONLY public.easy_thumbnails_thumbnaildimensions
    ADD CONSTRAINT easy_thumbnails_thumbnaildimensions_thumbnail_id_key UNIQUE (thumbnail_id);
 �   ALTER TABLE ONLY public.easy_thumbnails_thumbnaildimensions DROP CONSTRAINT easy_thumbnails_thumbnaildimensions_thumbnail_id_key;
       public            taiga    false    303            "           2606    9872671    epics_epic epics_epic_pkey 
   CONSTRAINT     X   ALTER TABLE ONLY public.epics_epic
    ADD CONSTRAINT epics_epic_pkey PRIMARY KEY (id);
 D   ALTER TABLE ONLY public.epics_epic DROP CONSTRAINT epics_epic_pkey;
       public            taiga    false    278            (           2606    9872679 2   epics_relateduserstory epics_relateduserstory_pkey 
   CONSTRAINT     p   ALTER TABLE ONLY public.epics_relateduserstory
    ADD CONSTRAINT epics_relateduserstory_pkey PRIMARY KEY (id);
 \   ALTER TABLE ONLY public.epics_relateduserstory DROP CONSTRAINT epics_relateduserstory_pkey;
       public            taiga    false    280            +           2606    9873018 Q   epics_relateduserstory epics_relateduserstory_user_story_id_epic_id_ad704d40_uniq 
   CONSTRAINT     �   ALTER TABLE ONLY public.epics_relateduserstory
    ADD CONSTRAINT epics_relateduserstory_user_story_id_epic_id_ad704d40_uniq UNIQUE (user_story_id, epic_id);
 {   ALTER TABLE ONLY public.epics_relateduserstory DROP CONSTRAINT epics_relateduserstory_user_story_id_epic_id_ad704d40_uniq;
       public            taiga    false    280    280            p           2606    9873063 \   external_apps_applicationtoken external_apps_applicatio_application_id_user_id_b6a9e9a8_uniq 
   CONSTRAINT     �   ALTER TABLE ONLY public.external_apps_applicationtoken
    ADD CONSTRAINT external_apps_applicatio_application_id_user_id_b6a9e9a8_uniq UNIQUE (application_id, user_id);
 �   ALTER TABLE ONLY public.external_apps_applicationtoken DROP CONSTRAINT external_apps_applicatio_application_id_user_id_b6a9e9a8_uniq;
       public            taiga    false    306    306            n           2606    9873050 8   external_apps_application external_apps_application_pkey 
   CONSTRAINT     v   ALTER TABLE ONLY public.external_apps_application
    ADD CONSTRAINT external_apps_application_pkey PRIMARY KEY (id);
 b   ALTER TABLE ONLY public.external_apps_application DROP CONSTRAINT external_apps_application_pkey;
       public            taiga    false    304            t           2606    9873061 B   external_apps_applicationtoken external_apps_applicationtoken_pkey 
   CONSTRAINT     �   ALTER TABLE ONLY public.external_apps_applicationtoken
    ADD CONSTRAINT external_apps_applicationtoken_pkey PRIMARY KEY (id);
 l   ALTER TABLE ONLY public.external_apps_applicationtoken DROP CONSTRAINT external_apps_applicationtoken_pkey;
       public            taiga    false    306            w           2606    9873088 2   feedback_feedbackentry feedback_feedbackentry_pkey 
   CONSTRAINT     p   ALTER TABLE ONLY public.feedback_feedbackentry
    ADD CONSTRAINT feedback_feedbackentry_pkey PRIMARY KEY (id);
 \   ALTER TABLE ONLY public.feedback_feedbackentry DROP CONSTRAINT feedback_feedbackentry_pkey;
       public            taiga    false    308                       2606    9872632 .   history_historyentry history_historyentry_pkey 
   CONSTRAINT     l   ALTER TABLE ONLY public.history_historyentry
    ADD CONSTRAINT history_historyentry_pkey PRIMARY KEY (id);
 X   ALTER TABLE ONLY public.history_historyentry DROP CONSTRAINT history_historyentry_pkey;
       public            taiga    false    276            �           2606    9871746    issues_issue issues_issue_pkey 
   CONSTRAINT     \   ALTER TABLE ONLY public.issues_issue
    ADD CONSTRAINT issues_issue_pkey PRIMARY KEY (id);
 H   ALTER TABLE ONLY public.issues_issue DROP CONSTRAINT issues_issue_pkey;
       public            taiga    false    243            �           2606    9872345 E   likes_like likes_like_content_type_id_object_id_user_id_e20903f0_uniq 
   CONSTRAINT     �   ALTER TABLE ONLY public.likes_like
    ADD CONSTRAINT likes_like_content_type_id_object_id_user_id_e20903f0_uniq UNIQUE (content_type_id, object_id, user_id);
 o   ALTER TABLE ONLY public.likes_like DROP CONSTRAINT likes_like_content_type_id_object_id_user_id_e20903f0_uniq;
       public            taiga    false    267    267    267            �           2606    9872331    likes_like likes_like_pkey 
   CONSTRAINT     X   ALTER TABLE ONLY public.likes_like
    ADD CONSTRAINT likes_like_pkey PRIMARY KEY (id);
 D   ALTER TABLE ONLY public.likes_like DROP CONSTRAINT likes_like_pkey;
       public            taiga    false    267            �           2606    9871705 G   milestones_milestone milestones_milestone_name_project_id_fe19fd36_uniq 
   CONSTRAINT     �   ALTER TABLE ONLY public.milestones_milestone
    ADD CONSTRAINT milestones_milestone_name_project_id_fe19fd36_uniq UNIQUE (name, project_id);
 q   ALTER TABLE ONLY public.milestones_milestone DROP CONSTRAINT milestones_milestone_name_project_id_fe19fd36_uniq;
       public            taiga    false    241    241            �           2606    9871693 .   milestones_milestone milestones_milestone_pkey 
   CONSTRAINT     l   ALTER TABLE ONLY public.milestones_milestone
    ADD CONSTRAINT milestones_milestone_pkey PRIMARY KEY (id);
 X   ALTER TABLE ONLY public.milestones_milestone DROP CONSTRAINT milestones_milestone_pkey;
       public            taiga    false    241            �           2606    9871703 G   milestones_milestone milestones_milestone_slug_project_id_e59bac6a_uniq 
   CONSTRAINT     �   ALTER TABLE ONLY public.milestones_milestone
    ADD CONSTRAINT milestones_milestone_slug_project_id_e59bac6a_uniq UNIQUE (slug, project_id);
 q   ALTER TABLE ONLY public.milestones_milestone DROP CONSTRAINT milestones_milestone_slug_project_id_e59bac6a_uniq;
       public            taiga    false    241    241            �           2606    9872058 t   notifications_historychangenotification_notify_users notifications_historycha_historychangenotificatio_3b0f323b_uniq 
   CONSTRAINT     �   ALTER TABLE ONLY public.notifications_historychangenotification_notify_users
    ADD CONSTRAINT notifications_historycha_historychangenotificatio_3b0f323b_uniq UNIQUE (historychangenotification_id, user_id);
 �   ALTER TABLE ONLY public.notifications_historychangenotification_notify_users DROP CONSTRAINT notifications_historycha_historychangenotificatio_3b0f323b_uniq;
       public            taiga    false    255    255            �           2606    9872643 w   notifications_historychangenotification_history_entries notifications_historycha_historychangenotificatio_8fb55cdd_uniq 
   CONSTRAINT     �   ALTER TABLE ONLY public.notifications_historychangenotification_history_entries
    ADD CONSTRAINT notifications_historycha_historychangenotificatio_8fb55cdd_uniq UNIQUE (historychangenotification_id, historyentry_id);
 �   ALTER TABLE ONLY public.notifications_historychangenotification_history_entries DROP CONSTRAINT notifications_historycha_historychangenotificatio_8fb55cdd_uniq;
       public            taiga    false    253    253            �           2606    9872062 g   notifications_historychangenotification notifications_historycha_key_owner_id_project_id__869f948f_uniq 
   CONSTRAINT     �   ALTER TABLE ONLY public.notifications_historychangenotification
    ADD CONSTRAINT notifications_historycha_key_owner_id_project_id__869f948f_uniq UNIQUE (key, owner_id, project_id, history_type);
 �   ALTER TABLE ONLY public.notifications_historychangenotification DROP CONSTRAINT notifications_historycha_key_owner_id_project_id__869f948f_uniq;
       public            taiga    false    251    251    251    251            �           2606    9872645 t   notifications_historychangenotification_history_entries notifications_historychangenotification_history_entries_pkey 
   CONSTRAINT     �   ALTER TABLE ONLY public.notifications_historychangenotification_history_entries
    ADD CONSTRAINT notifications_historychangenotification_history_entries_pkey PRIMARY KEY (id);
 �   ALTER TABLE ONLY public.notifications_historychangenotification_history_entries DROP CONSTRAINT notifications_historychangenotification_history_entries_pkey;
       public            taiga    false    253            �           2606    9872019 n   notifications_historychangenotification_notify_users notifications_historychangenotification_notify_users_pkey 
   CONSTRAINT     �   ALTER TABLE ONLY public.notifications_historychangenotification_notify_users
    ADD CONSTRAINT notifications_historychangenotification_notify_users_pkey PRIMARY KEY (id);
 �   ALTER TABLE ONLY public.notifications_historychangenotification_notify_users DROP CONSTRAINT notifications_historychangenotification_notify_users_pkey;
       public            taiga    false    255            �           2606    9872003 T   notifications_historychangenotification notifications_historychangenotification_pkey 
   CONSTRAINT     �   ALTER TABLE ONLY public.notifications_historychangenotification
    ADD CONSTRAINT notifications_historychangenotification_pkey PRIMARY KEY (id);
 ~   ALTER TABLE ONLY public.notifications_historychangenotification DROP CONSTRAINT notifications_historychangenotification_pkey;
       public            taiga    false    251            �           2606    9871960 :   notifications_notifypolicy notifications_notifypolicy_pkey 
   CONSTRAINT     x   ALTER TABLE ONLY public.notifications_notifypolicy
    ADD CONSTRAINT notifications_notifypolicy_pkey PRIMARY KEY (id);
 d   ALTER TABLE ONLY public.notifications_notifypolicy DROP CONSTRAINT notifications_notifypolicy_pkey;
       public            taiga    false    249            �           2606    9871962 V   notifications_notifypolicy notifications_notifypolicy_project_id_user_id_e7aa5cf2_uniq 
   CONSTRAINT     �   ALTER TABLE ONLY public.notifications_notifypolicy
    ADD CONSTRAINT notifications_notifypolicy_project_id_user_id_e7aa5cf2_uniq UNIQUE (project_id, user_id);
 �   ALTER TABLE ONLY public.notifications_notifypolicy DROP CONSTRAINT notifications_notifypolicy_project_id_user_id_e7aa5cf2_uniq;
       public            taiga    false    249    249            �           2606    9872073 R   notifications_watched notifications_watched_content_type_id_object_i_e7c27769_uniq 
   CONSTRAINT     �   ALTER TABLE ONLY public.notifications_watched
    ADD CONSTRAINT notifications_watched_content_type_id_object_i_e7c27769_uniq UNIQUE (content_type_id, object_id, user_id, project_id);
 |   ALTER TABLE ONLY public.notifications_watched DROP CONSTRAINT notifications_watched_content_type_id_object_i_e7c27769_uniq;
       public            taiga    false    257    257    257    257            �           2606    9872071 0   notifications_watched notifications_watched_pkey 
   CONSTRAINT     n   ALTER TABLE ONLY public.notifications_watched
    ADD CONSTRAINT notifications_watched_pkey PRIMARY KEY (id);
 Z   ALTER TABLE ONLY public.notifications_watched DROP CONSTRAINT notifications_watched_pkey;
       public            taiga    false    257            z           2606    9873148 @   notifications_webnotification notifications_webnotification_pkey 
   CONSTRAINT     ~   ALTER TABLE ONLY public.notifications_webnotification
    ADD CONSTRAINT notifications_webnotification_pkey PRIMARY KEY (id);
 j   ALTER TABLE ONLY public.notifications_webnotification DROP CONSTRAINT notifications_webnotification_pkey;
       public            taiga    false    310            �           2606    9872440 ,   projects_epicstatus projects_epicstatus_pkey 
   CONSTRAINT     j   ALTER TABLE ONLY public.projects_epicstatus
    ADD CONSTRAINT projects_epicstatus_pkey PRIMARY KEY (id);
 V   ALTER TABLE ONLY public.projects_epicstatus DROP CONSTRAINT projects_epicstatus_pkey;
       public            taiga    false    269                        2606    9872448 E   projects_epicstatus projects_epicstatus_project_id_name_b71c417e_uniq 
   CONSTRAINT     �   ALTER TABLE ONLY public.projects_epicstatus
    ADD CONSTRAINT projects_epicstatus_project_id_name_b71c417e_uniq UNIQUE (project_id, name);
 o   ALTER TABLE ONLY public.projects_epicstatus DROP CONSTRAINT projects_epicstatus_project_id_name_b71c417e_uniq;
       public            taiga    false    269    269                       2606    9872446 E   projects_epicstatus projects_epicstatus_project_id_slug_f67857e5_uniq 
   CONSTRAINT     �   ALTER TABLE ONLY public.projects_epicstatus
    ADD CONSTRAINT projects_epicstatus_project_id_slug_f67857e5_uniq UNIQUE (project_id, slug);
 o   ALTER TABLE ONLY public.projects_epicstatus DROP CONSTRAINT projects_epicstatus_project_id_slug_f67857e5_uniq;
       public            taiga    false    269    269            �           2606    9873187 0   projects_issueduedate projects_issueduedate_pkey 
   CONSTRAINT     n   ALTER TABLE ONLY public.projects_issueduedate
    ADD CONSTRAINT projects_issueduedate_pkey PRIMARY KEY (id);
 Z   ALTER TABLE ONLY public.projects_issueduedate DROP CONSTRAINT projects_issueduedate_pkey;
       public            taiga    false    314            �           2606    9873209 I   projects_issueduedate projects_issueduedate_project_id_name_cba303bc_uniq 
   CONSTRAINT     �   ALTER TABLE ONLY public.projects_issueduedate
    ADD CONSTRAINT projects_issueduedate_project_id_name_cba303bc_uniq UNIQUE (project_id, name);
 s   ALTER TABLE ONLY public.projects_issueduedate DROP CONSTRAINT projects_issueduedate_project_id_name_cba303bc_uniq;
       public            taiga    false    314    314            D           2606    9871404 .   projects_issuestatus projects_issuestatus_pkey 
   CONSTRAINT     l   ALTER TABLE ONLY public.projects_issuestatus
    ADD CONSTRAINT projects_issuestatus_pkey PRIMARY KEY (id);
 X   ALTER TABLE ONLY public.projects_issuestatus DROP CONSTRAINT projects_issuestatus_pkey;
       public            taiga    false    217            G           2606    9871479 G   projects_issuestatus projects_issuestatus_project_id_name_a88dd6c0_uniq 
   CONSTRAINT     �   ALTER TABLE ONLY public.projects_issuestatus
    ADD CONSTRAINT projects_issuestatus_project_id_name_a88dd6c0_uniq UNIQUE (project_id, name);
 q   ALTER TABLE ONLY public.projects_issuestatus DROP CONSTRAINT projects_issuestatus_project_id_name_a88dd6c0_uniq;
       public            taiga    false    217    217            I           2606    9873229 G   projects_issuestatus projects_issuestatus_project_id_slug_ca3e758d_uniq 
   CONSTRAINT     �   ALTER TABLE ONLY public.projects_issuestatus
    ADD CONSTRAINT projects_issuestatus_project_id_slug_ca3e758d_uniq UNIQUE (project_id, slug);
 q   ALTER TABLE ONLY public.projects_issuestatus DROP CONSTRAINT projects_issuestatus_project_id_slug_ca3e758d_uniq;
       public            taiga    false    217    217            M           2606    9871412 *   projects_issuetype projects_issuetype_pkey 
   CONSTRAINT     h   ALTER TABLE ONLY public.projects_issuetype
    ADD CONSTRAINT projects_issuetype_pkey PRIMARY KEY (id);
 T   ALTER TABLE ONLY public.projects_issuetype DROP CONSTRAINT projects_issuetype_pkey;
       public            taiga    false    219            P           2606    9871477 C   projects_issuetype projects_issuetype_project_id_name_41b47d87_uniq 
   CONSTRAINT     �   ALTER TABLE ONLY public.projects_issuetype
    ADD CONSTRAINT projects_issuetype_project_id_name_41b47d87_uniq UNIQUE (project_id, name);
 m   ALTER TABLE ONLY public.projects_issuetype DROP CONSTRAINT projects_issuetype_project_id_name_41b47d87_uniq;
       public            taiga    false    219    219                       2606    9871351 ,   projects_membership projects_membership_pkey 
   CONSTRAINT     j   ALTER TABLE ONLY public.projects_membership
    ADD CONSTRAINT projects_membership_pkey PRIMARY KEY (id);
 V   ALTER TABLE ONLY public.projects_membership DROP CONSTRAINT projects_membership_pkey;
       public            taiga    false    213                       2606    9871369 H   projects_membership projects_membership_user_id_project_id_a2829f61_uniq 
   CONSTRAINT     �   ALTER TABLE ONLY public.projects_membership
    ADD CONSTRAINT projects_membership_user_id_project_id_a2829f61_uniq UNIQUE (user_id, project_id);
 r   ALTER TABLE ONLY public.projects_membership DROP CONSTRAINT projects_membership_user_id_project_id_a2829f61_uniq;
       public            taiga    false    213    213            R           2606    9871420 $   projects_points projects_points_pkey 
   CONSTRAINT     b   ALTER TABLE ONLY public.projects_points
    ADD CONSTRAINT projects_points_pkey PRIMARY KEY (id);
 N   ALTER TABLE ONLY public.projects_points DROP CONSTRAINT projects_points_pkey;
       public            taiga    false    221            U           2606    9871475 =   projects_points projects_points_project_id_name_900c69f4_uniq 
   CONSTRAINT     �   ALTER TABLE ONLY public.projects_points
    ADD CONSTRAINT projects_points_project_id_name_900c69f4_uniq UNIQUE (project_id, name);
 g   ALTER TABLE ONLY public.projects_points DROP CONSTRAINT projects_points_project_id_name_900c69f4_uniq;
       public            taiga    false    221    221            W           2606    9871428 (   projects_priority projects_priority_pkey 
   CONSTRAINT     f   ALTER TABLE ONLY public.projects_priority
    ADD CONSTRAINT projects_priority_pkey PRIMARY KEY (id);
 R   ALTER TABLE ONLY public.projects_priority DROP CONSTRAINT projects_priority_pkey;
       public            taiga    false    223            Z           2606    9871473 A   projects_priority projects_priority_project_id_name_ca316bb1_uniq 
   CONSTRAINT     �   ALTER TABLE ONLY public.projects_priority
    ADD CONSTRAINT projects_priority_project_id_name_ca316bb1_uniq UNIQUE (project_id, name);
 k   ALTER TABLE ONLY public.projects_priority DROP CONSTRAINT projects_priority_project_id_name_ca316bb1_uniq;
       public            taiga    false    223    223                       2606    9872444 <   projects_project projects_project_default_epic_status_id_key 
   CONSTRAINT     �   ALTER TABLE ONLY public.projects_project
    ADD CONSTRAINT projects_project_default_epic_status_id_key UNIQUE (default_epic_status_id);
 f   ALTER TABLE ONLY public.projects_project DROP CONSTRAINT projects_project_default_epic_status_id_key;
       public            taiga    false    215                       2606    9871481 =   projects_project projects_project_default_issue_status_id_key 
   CONSTRAINT     �   ALTER TABLE ONLY public.projects_project
    ADD CONSTRAINT projects_project_default_issue_status_id_key UNIQUE (default_issue_status_id);
 g   ALTER TABLE ONLY public.projects_project DROP CONSTRAINT projects_project_default_issue_status_id_key;
       public            taiga    false    215                       2606    9871483 ;   projects_project projects_project_default_issue_type_id_key 
   CONSTRAINT     �   ALTER TABLE ONLY public.projects_project
    ADD CONSTRAINT projects_project_default_issue_type_id_key UNIQUE (default_issue_type_id);
 e   ALTER TABLE ONLY public.projects_project DROP CONSTRAINT projects_project_default_issue_type_id_key;
       public            taiga    false    215                       2606    9871485 7   projects_project projects_project_default_points_id_key 
   CONSTRAINT        ALTER TABLE ONLY public.projects_project
    ADD CONSTRAINT projects_project_default_points_id_key UNIQUE (default_points_id);
 a   ALTER TABLE ONLY public.projects_project DROP CONSTRAINT projects_project_default_points_id_key;
       public            taiga    false    215                        2606    9871487 9   projects_project projects_project_default_priority_id_key 
   CONSTRAINT     �   ALTER TABLE ONLY public.projects_project
    ADD CONSTRAINT projects_project_default_priority_id_key UNIQUE (default_priority_id);
 c   ALTER TABLE ONLY public.projects_project DROP CONSTRAINT projects_project_default_priority_id_key;
       public            taiga    false    215            "           2606    9871489 9   projects_project projects_project_default_severity_id_key 
   CONSTRAINT     �   ALTER TABLE ONLY public.projects_project
    ADD CONSTRAINT projects_project_default_severity_id_key UNIQUE (default_severity_id);
 c   ALTER TABLE ONLY public.projects_project DROP CONSTRAINT projects_project_default_severity_id_key;
       public            taiga    false    215            $           2606    9873275 9   projects_project projects_project_default_swimlane_id_key 
   CONSTRAINT     �   ALTER TABLE ONLY public.projects_project
    ADD CONSTRAINT projects_project_default_swimlane_id_key UNIQUE (default_swimlane_id);
 c   ALTER TABLE ONLY public.projects_project DROP CONSTRAINT projects_project_default_swimlane_id_key;
       public            taiga    false    215            &           2606    9871491 <   projects_project projects_project_default_task_status_id_key 
   CONSTRAINT     �   ALTER TABLE ONLY public.projects_project
    ADD CONSTRAINT projects_project_default_task_status_id_key UNIQUE (default_task_status_id);
 f   ALTER TABLE ONLY public.projects_project DROP CONSTRAINT projects_project_default_task_status_id_key;
       public            taiga    false    215            (           2606    9871493 :   projects_project projects_project_default_us_status_id_key 
   CONSTRAINT     �   ALTER TABLE ONLY public.projects_project
    ADD CONSTRAINT projects_project_default_us_status_id_key UNIQUE (default_us_status_id);
 d   ALTER TABLE ONLY public.projects_project DROP CONSTRAINT projects_project_default_us_status_id_key;
       public            taiga    false    215            0           2606    9871362 &   projects_project projects_project_pkey 
   CONSTRAINT     d   ALTER TABLE ONLY public.projects_project
    ADD CONSTRAINT projects_project_pkey PRIMARY KEY (id);
 P   ALTER TABLE ONLY public.projects_project DROP CONSTRAINT projects_project_pkey;
       public            taiga    false    215            3           2606    9871366 *   projects_project projects_project_slug_key 
   CONSTRAINT     e   ALTER TABLE ONLY public.projects_project
    ADD CONSTRAINT projects_project_slug_key UNIQUE (slug);
 T   ALTER TABLE ONLY public.projects_project DROP CONSTRAINT projects_project_slug_key;
       public            taiga    false    215            �           2606    9872258 @   projects_projectmodulesconfig projects_projectmodulesconfig_pkey 
   CONSTRAINT     ~   ALTER TABLE ONLY public.projects_projectmodulesconfig
    ADD CONSTRAINT projects_projectmodulesconfig_pkey PRIMARY KEY (id);
 j   ALTER TABLE ONLY public.projects_projectmodulesconfig DROP CONSTRAINT projects_projectmodulesconfig_pkey;
       public            taiga    false    263            �           2606    9872260 J   projects_projectmodulesconfig projects_projectmodulesconfig_project_id_key 
   CONSTRAINT     �   ALTER TABLE ONLY public.projects_projectmodulesconfig
    ADD CONSTRAINT projects_projectmodulesconfig_project_id_key UNIQUE (project_id);
 t   ALTER TABLE ONLY public.projects_projectmodulesconfig DROP CONSTRAINT projects_projectmodulesconfig_project_id_key;
       public            taiga    false    263            \           2606    9871439 6   projects_projecttemplate projects_projecttemplate_pkey 
   CONSTRAINT     t   ALTER TABLE ONLY public.projects_projecttemplate
    ADD CONSTRAINT projects_projecttemplate_pkey PRIMARY KEY (id);
 `   ALTER TABLE ONLY public.projects_projecttemplate DROP CONSTRAINT projects_projecttemplate_pkey;
       public            taiga    false    225            _           2606    9871441 :   projects_projecttemplate projects_projecttemplate_slug_key 
   CONSTRAINT     u   ALTER TABLE ONLY public.projects_projecttemplate
    ADD CONSTRAINT projects_projecttemplate_slug_key UNIQUE (slug);
 d   ALTER TABLE ONLY public.projects_projecttemplate DROP CONSTRAINT projects_projecttemplate_slug_key;
       public            taiga    false    225            a           2606    9871449 (   projects_severity projects_severity_pkey 
   CONSTRAINT     f   ALTER TABLE ONLY public.projects_severity
    ADD CONSTRAINT projects_severity_pkey PRIMARY KEY (id);
 R   ALTER TABLE ONLY public.projects_severity DROP CONSTRAINT projects_severity_pkey;
       public            taiga    false    227            d           2606    9871471 A   projects_severity projects_severity_project_id_name_6187c456_uniq 
   CONSTRAINT     �   ALTER TABLE ONLY public.projects_severity
    ADD CONSTRAINT projects_severity_project_id_name_6187c456_uniq UNIQUE (project_id, name);
 k   ALTER TABLE ONLY public.projects_severity DROP CONSTRAINT projects_severity_project_id_name_6187c456_uniq;
       public            taiga    false    227    227            �           2606    9873245 (   projects_swimlane projects_swimlane_pkey 
   CONSTRAINT     f   ALTER TABLE ONLY public.projects_swimlane
    ADD CONSTRAINT projects_swimlane_pkey PRIMARY KEY (id);
 R   ALTER TABLE ONLY public.projects_swimlane DROP CONSTRAINT projects_swimlane_pkey;
       public            taiga    false    320            �           2606    9873282 A   projects_swimlane projects_swimlane_project_id_name_a949892d_uniq 
   CONSTRAINT     �   ALTER TABLE ONLY public.projects_swimlane
    ADD CONSTRAINT projects_swimlane_project_id_name_a949892d_uniq UNIQUE (project_id, name);
 k   ALTER TABLE ONLY public.projects_swimlane DROP CONSTRAINT projects_swimlane_project_id_name_a949892d_uniq;
       public            taiga    false    320    320            �           2606    9873271 ]   projects_swimlaneuserstorystatus projects_swimlaneusersto_swimlane_id_status_id_d6ff394d_uniq 
   CONSTRAINT     �   ALTER TABLE ONLY public.projects_swimlaneuserstorystatus
    ADD CONSTRAINT projects_swimlaneusersto_swimlane_id_status_id_d6ff394d_uniq UNIQUE (swimlane_id, status_id);
 �   ALTER TABLE ONLY public.projects_swimlaneuserstorystatus DROP CONSTRAINT projects_swimlaneusersto_swimlane_id_status_id_d6ff394d_uniq;
       public            taiga    false    322    322            �           2606    9873259 F   projects_swimlaneuserstorystatus projects_swimlaneuserstorystatus_pkey 
   CONSTRAINT     �   ALTER TABLE ONLY public.projects_swimlaneuserstorystatus
    ADD CONSTRAINT projects_swimlaneuserstorystatus_pkey PRIMARY KEY (id);
 p   ALTER TABLE ONLY public.projects_swimlaneuserstorystatus DROP CONSTRAINT projects_swimlaneuserstorystatus_pkey;
       public            taiga    false    322            �           2606    9873195 .   projects_taskduedate projects_taskduedate_pkey 
   CONSTRAINT     l   ALTER TABLE ONLY public.projects_taskduedate
    ADD CONSTRAINT projects_taskduedate_pkey PRIMARY KEY (id);
 X   ALTER TABLE ONLY public.projects_taskduedate DROP CONSTRAINT projects_taskduedate_pkey;
       public            taiga    false    316            �           2606    9873207 G   projects_taskduedate projects_taskduedate_project_id_name_6270950e_uniq 
   CONSTRAINT     �   ALTER TABLE ONLY public.projects_taskduedate
    ADD CONSTRAINT projects_taskduedate_project_id_name_6270950e_uniq UNIQUE (project_id, name);
 q   ALTER TABLE ONLY public.projects_taskduedate DROP CONSTRAINT projects_taskduedate_project_id_name_6270950e_uniq;
       public            taiga    false    316    316            f           2606    9871457 ,   projects_taskstatus projects_taskstatus_pkey 
   CONSTRAINT     j   ALTER TABLE ONLY public.projects_taskstatus
    ADD CONSTRAINT projects_taskstatus_pkey PRIMARY KEY (id);
 V   ALTER TABLE ONLY public.projects_taskstatus DROP CONSTRAINT projects_taskstatus_pkey;
       public            taiga    false    229            i           2606    9871469 E   projects_taskstatus projects_taskstatus_project_id_name_4b65b78f_uniq 
   CONSTRAINT     �   ALTER TABLE ONLY public.projects_taskstatus
    ADD CONSTRAINT projects_taskstatus_project_id_name_4b65b78f_uniq UNIQUE (project_id, name);
 o   ALTER TABLE ONLY public.projects_taskstatus DROP CONSTRAINT projects_taskstatus_project_id_name_4b65b78f_uniq;
       public            taiga    false    229    229            k           2606    9872244 E   projects_taskstatus projects_taskstatus_project_id_slug_30401ba3_uniq 
   CONSTRAINT     �   ALTER TABLE ONLY public.projects_taskstatus
    ADD CONSTRAINT projects_taskstatus_project_id_slug_30401ba3_uniq UNIQUE (project_id, slug);
 o   ALTER TABLE ONLY public.projects_taskstatus DROP CONSTRAINT projects_taskstatus_project_id_slug_30401ba3_uniq;
       public            taiga    false    229    229            �           2606    9873203 8   projects_userstoryduedate projects_userstoryduedate_pkey 
   CONSTRAINT     v   ALTER TABLE ONLY public.projects_userstoryduedate
    ADD CONSTRAINT projects_userstoryduedate_pkey PRIMARY KEY (id);
 b   ALTER TABLE ONLY public.projects_userstoryduedate DROP CONSTRAINT projects_userstoryduedate_pkey;
       public            taiga    false    318            �           2606    9873205 Q   projects_userstoryduedate projects_userstoryduedate_project_id_name_177c510a_uniq 
   CONSTRAINT     �   ALTER TABLE ONLY public.projects_userstoryduedate
    ADD CONSTRAINT projects_userstoryduedate_project_id_name_177c510a_uniq UNIQUE (project_id, name);
 {   ALTER TABLE ONLY public.projects_userstoryduedate DROP CONSTRAINT projects_userstoryduedate_project_id_name_177c510a_uniq;
       public            taiga    false    318    318            o           2606    9871465 6   projects_userstorystatus projects_userstorystatus_pkey 
   CONSTRAINT     t   ALTER TABLE ONLY public.projects_userstorystatus
    ADD CONSTRAINT projects_userstorystatus_pkey PRIMARY KEY (id);
 `   ALTER TABLE ONLY public.projects_userstorystatus DROP CONSTRAINT projects_userstorystatus_pkey;
       public            taiga    false    231            r           2606    9871467 O   projects_userstorystatus projects_userstorystatus_project_id_name_7c0a1351_uniq 
   CONSTRAINT     �   ALTER TABLE ONLY public.projects_userstorystatus
    ADD CONSTRAINT projects_userstorystatus_project_id_name_7c0a1351_uniq UNIQUE (project_id, name);
 y   ALTER TABLE ONLY public.projects_userstorystatus DROP CONSTRAINT projects_userstorystatus_project_id_name_7c0a1351_uniq;
       public            taiga    false    231    231            t           2606    9872246 O   projects_userstorystatus projects_userstorystatus_project_id_slug_97a888b5_uniq 
   CONSTRAINT     �   ALTER TABLE ONLY public.projects_userstorystatus
    ADD CONSTRAINT projects_userstorystatus_project_id_slug_97a888b5_uniq UNIQUE (project_id, slug);
 y   ALTER TABLE ONLY public.projects_userstorystatus DROP CONSTRAINT projects_userstorystatus_project_id_slug_97a888b5_uniq;
       public            taiga    false    231    231            �           2606    9873299 .   references_reference references_reference_pkey 
   CONSTRAINT     l   ALTER TABLE ONLY public.references_reference
    ADD CONSTRAINT references_reference_pkey PRIMARY KEY (id);
 X   ALTER TABLE ONLY public.references_reference DROP CONSTRAINT references_reference_pkey;
       public            taiga    false    324            �           2606    9873301 F   references_reference references_reference_project_id_ref_82d64d63_uniq 
   CONSTRAINT     �   ALTER TABLE ONLY public.references_reference
    ADD CONSTRAINT references_reference_project_id_ref_82d64d63_uniq UNIQUE (project_id, ref);
 p   ALTER TABLE ONLY public.references_reference DROP CONSTRAINT references_reference_project_id_ref_82d64d63_uniq;
       public            taiga    false    324    324            �           2606    9873331 >   settings_userprojectsettings settings_userprojectsettings_pkey 
   CONSTRAINT     |   ALTER TABLE ONLY public.settings_userprojectsettings
    ADD CONSTRAINT settings_userprojectsettings_pkey PRIMARY KEY (id);
 h   ALTER TABLE ONLY public.settings_userprojectsettings DROP CONSTRAINT settings_userprojectsettings_pkey;
       public            taiga    false    327            �           2606    9873333 Z   settings_userprojectsettings settings_userprojectsettings_project_id_user_id_330ddee9_uniq 
   CONSTRAINT     �   ALTER TABLE ONLY public.settings_userprojectsettings
    ADD CONSTRAINT settings_userprojectsettings_project_id_user_id_330ddee9_uniq UNIQUE (project_id, user_id);
 �   ALTER TABLE ONLY public.settings_userprojectsettings DROP CONSTRAINT settings_userprojectsettings_project_id_user_id_330ddee9_uniq;
       public            taiga    false    327    327            �           2606    9872102    tasks_task tasks_task_pkey 
   CONSTRAINT     X   ALTER TABLE ONLY public.tasks_task
    ADD CONSTRAINT tasks_task_pkey PRIMARY KEY (id);
 D   ALTER TABLE ONLY public.tasks_task DROP CONSTRAINT tasks_task_pkey;
       public            taiga    false    259            �           2606    9873387 <   telemetry_instancetelemetry telemetry_instancetelemetry_pkey 
   CONSTRAINT     z   ALTER TABLE ONLY public.telemetry_instancetelemetry
    ADD CONSTRAINT telemetry_instancetelemetry_pkey PRIMARY KEY (id);
 f   ALTER TABLE ONLY public.telemetry_instancetelemetry DROP CONSTRAINT telemetry_instancetelemetry_pkey;
       public            taiga    false    329            �           2606    9872284 (   timeline_timeline timeline_timeline_pkey 
   CONSTRAINT     f   ALTER TABLE ONLY public.timeline_timeline
    ADD CONSTRAINT timeline_timeline_pkey PRIMARY KEY (id);
 R   ALTER TABLE ONLY public.timeline_timeline DROP CONSTRAINT timeline_timeline_pkey;
       public            taiga    false    265            �           2606    9873428 B   token_denylist_denylistedtoken token_denylist_denylistedtoken_pkey 
   CONSTRAINT     �   ALTER TABLE ONLY public.token_denylist_denylistedtoken
    ADD CONSTRAINT token_denylist_denylistedtoken_pkey PRIMARY KEY (id);
 l   ALTER TABLE ONLY public.token_denylist_denylistedtoken DROP CONSTRAINT token_denylist_denylistedtoken_pkey;
       public            taiga    false    333            �           2606    9873430 J   token_denylist_denylistedtoken token_denylist_denylistedtoken_token_id_key 
   CONSTRAINT     �   ALTER TABLE ONLY public.token_denylist_denylistedtoken
    ADD CONSTRAINT token_denylist_denylistedtoken_token_id_key UNIQUE (token_id);
 t   ALTER TABLE ONLY public.token_denylist_denylistedtoken DROP CONSTRAINT token_denylist_denylistedtoken_token_id_key;
       public            taiga    false    333            �           2606    9873420 G   token_denylist_outstandingtoken token_denylist_outstandingtoken_jti_key 
   CONSTRAINT     �   ALTER TABLE ONLY public.token_denylist_outstandingtoken
    ADD CONSTRAINT token_denylist_outstandingtoken_jti_key UNIQUE (jti);
 q   ALTER TABLE ONLY public.token_denylist_outstandingtoken DROP CONSTRAINT token_denylist_outstandingtoken_jti_key;
       public            taiga    false    331            �           2606    9873418 D   token_denylist_outstandingtoken token_denylist_outstandingtoken_pkey 
   CONSTRAINT     �   ALTER TABLE ONLY public.token_denylist_outstandingtoken
    ADD CONSTRAINT token_denylist_outstandingtoken_pkey PRIMARY KEY (id);
 n   ALTER TABLE ONLY public.token_denylist_outstandingtoken DROP CONSTRAINT token_denylist_outstandingtoken_pkey;
       public            taiga    false    331            �           2606    9872186 5   users_authdata users_authdata_key_value_7ee3acc9_uniq 
   CONSTRAINT     v   ALTER TABLE ONLY public.users_authdata
    ADD CONSTRAINT users_authdata_key_value_7ee3acc9_uniq UNIQUE (key, value);
 _   ALTER TABLE ONLY public.users_authdata DROP CONSTRAINT users_authdata_key_value_7ee3acc9_uniq;
       public            taiga    false    261    261            �           2606    9872184 "   users_authdata users_authdata_pkey 
   CONSTRAINT     `   ALTER TABLE ONLY public.users_authdata
    ADD CONSTRAINT users_authdata_pkey PRIMARY KEY (id);
 L   ALTER TABLE ONLY public.users_authdata DROP CONSTRAINT users_authdata_pkey;
       public            taiga    false    261                       2606    9871341    users_role users_role_pkey 
   CONSTRAINT     X   ALTER TABLE ONLY public.users_role
    ADD CONSTRAINT users_role_pkey PRIMARY KEY (id);
 D   ALTER TABLE ONLY public.users_role DROP CONSTRAINT users_role_pkey;
       public            taiga    false    211                       2606    9871670 3   users_role users_role_slug_project_id_db8c270c_uniq 
   CONSTRAINT     z   ALTER TABLE ONLY public.users_role
    ADD CONSTRAINT users_role_slug_project_id_db8c270c_uniq UNIQUE (slug, project_id);
 ]   ALTER TABLE ONLY public.users_role DROP CONSTRAINT users_role_slug_project_id_db8c270c_uniq;
       public            taiga    false    211    211            �           2606    9871678 )   users_user users_user_email_243f6e77_uniq 
   CONSTRAINT     e   ALTER TABLE ONLY public.users_user
    ADD CONSTRAINT users_user_email_243f6e77_uniq UNIQUE (email);
 S   ALTER TABLE ONLY public.users_user DROP CONSTRAINT users_user_email_243f6e77_uniq;
       public            taiga    false    207            �           2606    9871303    users_user users_user_pkey 
   CONSTRAINT     X   ALTER TABLE ONLY public.users_user
    ADD CONSTRAINT users_user_pkey PRIMARY KEY (id);
 D   ALTER TABLE ONLY public.users_user DROP CONSTRAINT users_user_pkey;
       public            taiga    false    207            �           2606    9871681 "   users_user users_user_username_key 
   CONSTRAINT     a   ALTER TABLE ONLY public.users_user
    ADD CONSTRAINT users_user_username_key UNIQUE (username);
 L   ALTER TABLE ONLY public.users_user DROP CONSTRAINT users_user_username_key;
       public            taiga    false    207                       2606    9873458 (   users_user users_user_uuid_6fe513d7_uniq 
   CONSTRAINT     c   ALTER TABLE ONLY public.users_user
    ADD CONSTRAINT users_user_uuid_6fe513d7_uniq UNIQUE (uuid);
 R   ALTER TABLE ONLY public.users_user DROP CONSTRAINT users_user_uuid_6fe513d7_uniq;
       public            taiga    false    207            �           2606    9873475 ,   users_workspacerole users_workspacerole_pkey 
   CONSTRAINT     j   ALTER TABLE ONLY public.users_workspacerole
    ADD CONSTRAINT users_workspacerole_pkey PRIMARY KEY (id);
 V   ALTER TABLE ONLY public.users_workspacerole DROP CONSTRAINT users_workspacerole_pkey;
       public            taiga    false    335            �           2606    9873482 G   users_workspacerole users_workspacerole_slug_workspace_id_1c9aef12_uniq 
   CONSTRAINT     �   ALTER TABLE ONLY public.users_workspacerole
    ADD CONSTRAINT users_workspacerole_slug_workspace_id_1c9aef12_uniq UNIQUE (slug, workspace_id);
 q   ALTER TABLE ONLY public.users_workspacerole DROP CONSTRAINT users_workspacerole_slug_workspace_id_1c9aef12_uniq;
       public            taiga    false    335    335            �           2606    9873498 L   userstorage_storageentry userstorage_storageentry_owner_id_key_746399cb_uniq 
   CONSTRAINT     �   ALTER TABLE ONLY public.userstorage_storageentry
    ADD CONSTRAINT userstorage_storageentry_owner_id_key_746399cb_uniq UNIQUE (owner_id, key);
 v   ALTER TABLE ONLY public.userstorage_storageentry DROP CONSTRAINT userstorage_storageentry_owner_id_key_746399cb_uniq;
       public            taiga    false    337    337            �           2606    9873496 6   userstorage_storageentry userstorage_storageentry_pkey 
   CONSTRAINT     t   ALTER TABLE ONLY public.userstorage_storageentry
    ADD CONSTRAINT userstorage_storageentry_pkey PRIMARY KEY (id);
 `   ALTER TABLE ONLY public.userstorage_storageentry DROP CONSTRAINT userstorage_storageentry_pkey;
       public            taiga    false    337            �           2606    9871825 2   userstories_rolepoints userstories_rolepoints_pkey 
   CONSTRAINT     p   ALTER TABLE ONLY public.userstories_rolepoints
    ADD CONSTRAINT userstories_rolepoints_pkey PRIMARY KEY (id);
 \   ALTER TABLE ONLY public.userstories_rolepoints DROP CONSTRAINT userstories_rolepoints_pkey;
       public            taiga    false    245            �           2606    9871847 Q   userstories_rolepoints userstories_rolepoints_user_story_id_role_id_dc0ba15e_uniq 
   CONSTRAINT     �   ALTER TABLE ONLY public.userstories_rolepoints
    ADD CONSTRAINT userstories_rolepoints_user_story_id_role_id_dc0ba15e_uniq UNIQUE (user_story_id, role_id);
 {   ALTER TABLE ONLY public.userstories_rolepoints DROP CONSTRAINT userstories_rolepoints_user_story_id_role_id_dc0ba15e_uniq;
       public            taiga    false    245    245            �           2606    9873576 `   userstories_userstory_assigned_users userstories_userstory_as_userstory_id_user_id_beae1231_uniq 
   CONSTRAINT     �   ALTER TABLE ONLY public.userstories_userstory_assigned_users
    ADD CONSTRAINT userstories_userstory_as_userstory_id_user_id_beae1231_uniq UNIQUE (userstory_id, user_id);
 �   ALTER TABLE ONLY public.userstories_userstory_assigned_users DROP CONSTRAINT userstories_userstory_as_userstory_id_user_id_beae1231_uniq;
       public            taiga    false    339    339            �           2606    9873564 N   userstories_userstory_assigned_users userstories_userstory_assigned_users_pkey 
   CONSTRAINT     �   ALTER TABLE ONLY public.userstories_userstory_assigned_users
    ADD CONSTRAINT userstories_userstory_assigned_users_pkey PRIMARY KEY (id);
 x   ALTER TABLE ONLY public.userstories_userstory_assigned_users DROP CONSTRAINT userstories_userstory_assigned_users_pkey;
       public            taiga    false    339            �           2606    9871837 0   userstories_userstory userstories_userstory_pkey 
   CONSTRAINT     n   ALTER TABLE ONLY public.userstories_userstory
    ADD CONSTRAINT userstories_userstory_pkey PRIMARY KEY (id);
 Z   ALTER TABLE ONLY public.userstories_userstory DROP CONSTRAINT userstories_userstory_pkey;
       public            taiga    false    247            �           2606    9873618 E   votes_vote votes_vote_content_type_id_object_id_user_id_97d16fa0_uniq 
   CONSTRAINT     �   ALTER TABLE ONLY public.votes_vote
    ADD CONSTRAINT votes_vote_content_type_id_object_id_user_id_97d16fa0_uniq UNIQUE (content_type_id, object_id, user_id);
 o   ALTER TABLE ONLY public.votes_vote DROP CONSTRAINT votes_vote_content_type_id_object_id_user_id_97d16fa0_uniq;
       public            taiga    false    341    341    341            �           2606    9873604    votes_vote votes_vote_pkey 
   CONSTRAINT     X   ALTER TABLE ONLY public.votes_vote
    ADD CONSTRAINT votes_vote_pkey PRIMARY KEY (id);
 D   ALTER TABLE ONLY public.votes_vote DROP CONSTRAINT votes_vote_pkey;
       public            taiga    false    341            �           2606    9873616 ?   votes_votes votes_votes_content_type_id_object_id_5abfc91b_uniq 
   CONSTRAINT     �   ALTER TABLE ONLY public.votes_votes
    ADD CONSTRAINT votes_votes_content_type_id_object_id_5abfc91b_uniq UNIQUE (content_type_id, object_id);
 i   ALTER TABLE ONLY public.votes_votes DROP CONSTRAINT votes_votes_content_type_id_object_id_5abfc91b_uniq;
       public            taiga    false    343    343            �           2606    9873614    votes_votes votes_votes_pkey 
   CONSTRAINT     Z   ALTER TABLE ONLY public.votes_votes
    ADD CONSTRAINT votes_votes_pkey PRIMARY KEY (id);
 F   ALTER TABLE ONLY public.votes_votes DROP CONSTRAINT votes_votes_pkey;
       public            taiga    false    343            �           2606    9873653 &   webhooks_webhook webhooks_webhook_pkey 
   CONSTRAINT     d   ALTER TABLE ONLY public.webhooks_webhook
    ADD CONSTRAINT webhooks_webhook_pkey PRIMARY KEY (id);
 P   ALTER TABLE ONLY public.webhooks_webhook DROP CONSTRAINT webhooks_webhook_pkey;
       public            taiga    false    345            �           2606    9873664 ,   webhooks_webhooklog webhooks_webhooklog_pkey 
   CONSTRAINT     j   ALTER TABLE ONLY public.webhooks_webhooklog
    ADD CONSTRAINT webhooks_webhooklog_pkey PRIMARY KEY (id);
 V   ALTER TABLE ONLY public.webhooks_webhooklog DROP CONSTRAINT webhooks_webhooklog_pkey;
       public            taiga    false    347                       2606    9872543     wiki_wikilink wiki_wikilink_pkey 
   CONSTRAINT     ^   ALTER TABLE ONLY public.wiki_wikilink
    ADD CONSTRAINT wiki_wikilink_pkey PRIMARY KEY (id);
 J   ALTER TABLE ONLY public.wiki_wikilink DROP CONSTRAINT wiki_wikilink_pkey;
       public            taiga    false    273                       2606    9872566 9   wiki_wikilink wiki_wikilink_project_id_href_a39ae7e7_uniq 
   CONSTRAINT     �   ALTER TABLE ONLY public.wiki_wikilink
    ADD CONSTRAINT wiki_wikilink_project_id_href_a39ae7e7_uniq UNIQUE (project_id, href);
 c   ALTER TABLE ONLY public.wiki_wikilink DROP CONSTRAINT wiki_wikilink_project_id_href_a39ae7e7_uniq;
       public            taiga    false    273    273                       2606    9872554     wiki_wikipage wiki_wikipage_pkey 
   CONSTRAINT     ^   ALTER TABLE ONLY public.wiki_wikipage
    ADD CONSTRAINT wiki_wikipage_pkey PRIMARY KEY (id);
 J   ALTER TABLE ONLY public.wiki_wikipage DROP CONSTRAINT wiki_wikipage_pkey;
       public            taiga    false    275                       2606    9872564 9   wiki_wikipage wiki_wikipage_project_id_slug_cb5b63e2_uniq 
   CONSTRAINT     �   ALTER TABLE ONLY public.wiki_wikipage
    ADD CONSTRAINT wiki_wikipage_project_id_slug_cb5b63e2_uniq UNIQUE (project_id, slug);
 c   ALTER TABLE ONLY public.wiki_wikipage DROP CONSTRAINT wiki_wikipage_project_id_slug_cb5b63e2_uniq;
       public            taiga    false    275    275                       2606    9873164 .   workspaces_workspace workspaces_workspace_pkey 
   CONSTRAINT     l   ALTER TABLE ONLY public.workspaces_workspace
    ADD CONSTRAINT workspaces_workspace_pkey PRIMARY KEY (id);
 X   ALTER TABLE ONLY public.workspaces_workspace DROP CONSTRAINT workspaces_workspace_pkey;
       public            taiga    false    312            �           2606    9873166 2   workspaces_workspace workspaces_workspace_slug_key 
   CONSTRAINT     m   ALTER TABLE ONLY public.workspaces_workspace
    ADD CONSTRAINT workspaces_workspace_slug_key UNIQUE (slug);
 \   ALTER TABLE ONLY public.workspaces_workspace DROP CONSTRAINT workspaces_workspace_slug_key;
       public            taiga    false    312            �           2606    9873725 Z   workspaces_workspacemembership workspaces_workspacememb_user_id_workspace_id_92c1b27f_uniq 
   CONSTRAINT     �   ALTER TABLE ONLY public.workspaces_workspacemembership
    ADD CONSTRAINT workspaces_workspacememb_user_id_workspace_id_92c1b27f_uniq UNIQUE (user_id, workspace_id);
 �   ALTER TABLE ONLY public.workspaces_workspacemembership DROP CONSTRAINT workspaces_workspacememb_user_id_workspace_id_92c1b27f_uniq;
       public            taiga    false    349    349            �           2606    9873708 B   workspaces_workspacemembership workspaces_workspacemembership_pkey 
   CONSTRAINT     �   ALTER TABLE ONLY public.workspaces_workspacemembership
    ADD CONSTRAINT workspaces_workspacemembership_pkey PRIMARY KEY (id);
 l   ALTER TABLE ONLY public.workspaces_workspacemembership DROP CONSTRAINT workspaces_workspacemembership_pkey;
       public            taiga    false    349            w           1259    9871605 /   attachments_attachment_content_type_id_35dd9d5d    INDEX     }   CREATE INDEX attachments_attachment_content_type_id_35dd9d5d ON public.attachments_attachment USING btree (content_type_id);
 C   DROP INDEX public.attachments_attachment_content_type_id_35dd9d5d;
       public            taiga    false    233            x           1259    9871615 =   attachments_attachment_content_type_id_object_id_3f2e447c_idx    INDEX     �   CREATE INDEX attachments_attachment_content_type_id_object_id_3f2e447c_idx ON public.attachments_attachment USING btree (content_type_id, object_id);
 Q   DROP INDEX public.attachments_attachment_content_type_id_object_id_3f2e447c_idx;
       public            taiga    false    233    233            y           1259    9871606 (   attachments_attachment_owner_id_720defb8    INDEX     o   CREATE INDEX attachments_attachment_owner_id_720defb8 ON public.attachments_attachment USING btree (owner_id);
 <   DROP INDEX public.attachments_attachment_owner_id_720defb8;
       public            taiga    false    233            |           1259    9871607 *   attachments_attachment_project_id_50714f52    INDEX     s   CREATE INDEX attachments_attachment_project_id_50714f52 ON public.attachments_attachment USING btree (project_id);
 >   DROP INDEX public.attachments_attachment_project_id_50714f52;
       public            taiga    false    233            �           1259    9871668    auth_group_name_a6ea08ec_like    INDEX     h   CREATE INDEX auth_group_name_a6ea08ec_like ON public.auth_group USING btree (name varchar_pattern_ops);
 1   DROP INDEX public.auth_group_name_a6ea08ec_like;
       public            taiga    false    237            �           1259    9871664 (   auth_group_permissions_group_id_b120cbf9    INDEX     o   CREATE INDEX auth_group_permissions_group_id_b120cbf9 ON public.auth_group_permissions USING btree (group_id);
 <   DROP INDEX public.auth_group_permissions_group_id_b120cbf9;
       public            taiga    false    239            �           1259    9871665 -   auth_group_permissions_permission_id_84c5c92e    INDEX     y   CREATE INDEX auth_group_permissions_permission_id_84c5c92e ON public.auth_group_permissions USING btree (permission_id);
 A   DROP INDEX public.auth_group_permissions_permission_id_84c5c92e;
       public            taiga    false    239            }           1259    9871650 (   auth_permission_content_type_id_2f476e4b    INDEX     o   CREATE INDEX auth_permission_content_type_id_2f476e4b ON public.auth_permission USING btree (content_type_id);
 <   DROP INDEX public.auth_permission_content_type_id_2f476e4b;
       public            taiga    false    235                       1259    9872530 (   contact_contactentry_project_id_27bfec4e    INDEX     o   CREATE INDEX contact_contactentry_project_id_27bfec4e ON public.contact_contactentry USING btree (project_id);
 <   DROP INDEX public.contact_contactentry_project_id_27bfec4e;
       public            taiga    false    271                       1259    9872531 %   contact_contactentry_user_id_f1f19c5f    INDEX     i   CREATE INDEX contact_contactentry_user_id_f1f19c5f ON public.contact_contactentry USING btree (user_id);
 9   DROP INDEX public.contact_contactentry_user_id_f1f19c5f;
       public            taiga    false    271            O           1259    9872869 -   custom_attributes_epiccu_epic_id_d413e57a_idx    INDEX     �   CREATE INDEX custom_attributes_epiccu_epic_id_d413e57a_idx ON public.custom_attributes_epiccustomattributesvalues USING btree (epic_id);
 A   DROP INDEX public.custom_attributes_epiccu_epic_id_d413e57a_idx;
       public            taiga    false    296            N           1259    9872878 9   custom_attributes_epiccustomattribute_project_id_ad2cfaa8    INDEX     �   CREATE INDEX custom_attributes_epiccustomattribute_project_id_ad2cfaa8 ON public.custom_attributes_epiccustomattribute USING btree (project_id);
 M   DROP INDEX public.custom_attributes_epiccustomattribute_project_id_ad2cfaa8;
       public            taiga    false    294            ;           1259    9872842 .   custom_attributes_issuec_issue_id_868161f8_idx    INDEX     �   CREATE INDEX custom_attributes_issuec_issue_id_868161f8_idx ON public.custom_attributes_issuecustomattributesvalues USING btree (issue_id);
 B   DROP INDEX public.custom_attributes_issuec_issue_id_868161f8_idx;
       public            taiga    false    288            0           1259    9872764 :   custom_attributes_issuecustomattribute_project_id_3b4acff5    INDEX     �   CREATE INDEX custom_attributes_issuecustomattribute_project_id_3b4acff5 ON public.custom_attributes_issuecustomattribute USING btree (project_id);
 N   DROP INDEX public.custom_attributes_issuecustomattribute_project_id_3b4acff5;
       public            taiga    false    282            @           1259    9872843 -   custom_attributes_taskcu_task_id_3d1ccf5e_idx    INDEX     �   CREATE INDEX custom_attributes_taskcu_task_id_3d1ccf5e_idx ON public.custom_attributes_taskcustomattributesvalues USING btree (task_id);
 A   DROP INDEX public.custom_attributes_taskcu_task_id_3d1ccf5e_idx;
       public            taiga    false    290            5           1259    9872770 9   custom_attributes_taskcustomattribute_project_id_f0f622a8    INDEX     �   CREATE INDEX custom_attributes_taskcustomattribute_project_id_f0f622a8 ON public.custom_attributes_taskcustomattribute USING btree (project_id);
 M   DROP INDEX public.custom_attributes_taskcustomattribute_project_id_f0f622a8;
       public            taiga    false    284            E           1259    9872844 3   custom_attributes_userst_user_story_id_99b10c43_idx    INDEX     �   CREATE INDEX custom_attributes_userst_user_story_id_99b10c43_idx ON public.custom_attributes_userstorycustomattributesvalues USING btree (user_story_id);
 G   DROP INDEX public.custom_attributes_userst_user_story_id_99b10c43_idx;
       public            taiga    false    292            :           1259    9872776 >   custom_attributes_userstorycustomattribute_project_id_2619cf6c    INDEX     �   CREATE INDEX custom_attributes_userstorycustomattribute_project_id_2619cf6c ON public.custom_attributes_userstorycustomattribute USING btree (project_id);
 R   DROP INDEX public.custom_attributes_userstorycustomattribute_project_id_2619cf6c;
       public            taiga    false    286                       1259    9871329 )   django_admin_log_content_type_id_c4bce8eb    INDEX     q   CREATE INDEX django_admin_log_content_type_id_c4bce8eb ON public.django_admin_log USING btree (content_type_id);
 =   DROP INDEX public.django_admin_log_content_type_id_c4bce8eb;
       public            taiga    false    209                       1259    9871330 !   django_admin_log_user_id_c564eba6    INDEX     a   CREATE INDEX django_admin_log_user_id_c564eba6 ON public.django_admin_log USING btree (user_id);
 5   DROP INDEX public.django_admin_log_user_id_c564eba6;
       public            taiga    false    209            �           1259    9873323 #   django_session_expire_date_a5c62663    INDEX     e   CREATE INDEX django_session_expire_date_a5c62663 ON public.django_session USING btree (expire_date);
 7   DROP INDEX public.django_session_expire_date_a5c62663;
       public            taiga    false    325            �           1259    9873322 (   django_session_session_key_c0390e0f_like    INDEX     ~   CREATE INDEX django_session_session_key_c0390e0f_like ON public.django_session USING btree (session_key varchar_pattern_ops);
 <   DROP INDEX public.django_session_session_key_c0390e0f_like;
       public            taiga    false    325            V           1259    9872965 !   djmail_message_uuid_8dad4f24_like    INDEX     p   CREATE INDEX djmail_message_uuid_8dad4f24_like ON public.djmail_message USING btree (uuid varchar_pattern_ops);
 5   DROP INDEX public.djmail_message_uuid_8dad4f24_like;
       public            taiga    false    297            W           1259    9872988 $   easy_thumbnails_source_name_5fe0edc6    INDEX     g   CREATE INDEX easy_thumbnails_source_name_5fe0edc6 ON public.easy_thumbnails_source USING btree (name);
 8   DROP INDEX public.easy_thumbnails_source_name_5fe0edc6;
       public            taiga    false    299            X           1259    9872989 )   easy_thumbnails_source_name_5fe0edc6_like    INDEX     �   CREATE INDEX easy_thumbnails_source_name_5fe0edc6_like ON public.easy_thumbnails_source USING btree (name varchar_pattern_ops);
 =   DROP INDEX public.easy_thumbnails_source_name_5fe0edc6_like;
       public            taiga    false    299            [           1259    9872986 ,   easy_thumbnails_source_storage_hash_946cbcc9    INDEX     w   CREATE INDEX easy_thumbnails_source_storage_hash_946cbcc9 ON public.easy_thumbnails_source USING btree (storage_hash);
 @   DROP INDEX public.easy_thumbnails_source_storage_hash_946cbcc9;
       public            taiga    false    299            \           1259    9872987 1   easy_thumbnails_source_storage_hash_946cbcc9_like    INDEX     �   CREATE INDEX easy_thumbnails_source_storage_hash_946cbcc9_like ON public.easy_thumbnails_source USING btree (storage_hash varchar_pattern_ops);
 E   DROP INDEX public.easy_thumbnails_source_storage_hash_946cbcc9_like;
       public            taiga    false    299            a           1259    9872997 '   easy_thumbnails_thumbnail_name_b5882c31    INDEX     m   CREATE INDEX easy_thumbnails_thumbnail_name_b5882c31 ON public.easy_thumbnails_thumbnail USING btree (name);
 ;   DROP INDEX public.easy_thumbnails_thumbnail_name_b5882c31;
       public            taiga    false    301            b           1259    9872998 ,   easy_thumbnails_thumbnail_name_b5882c31_like    INDEX     �   CREATE INDEX easy_thumbnails_thumbnail_name_b5882c31_like ON public.easy_thumbnails_thumbnail USING btree (name varchar_pattern_ops);
 @   DROP INDEX public.easy_thumbnails_thumbnail_name_b5882c31_like;
       public            taiga    false    301            e           1259    9872999 ,   easy_thumbnails_thumbnail_source_id_5b57bc77    INDEX     w   CREATE INDEX easy_thumbnails_thumbnail_source_id_5b57bc77 ON public.easy_thumbnails_thumbnail USING btree (source_id);
 @   DROP INDEX public.easy_thumbnails_thumbnail_source_id_5b57bc77;
       public            taiga    false    301            f           1259    9872995 /   easy_thumbnails_thumbnail_storage_hash_f1435f49    INDEX     }   CREATE INDEX easy_thumbnails_thumbnail_storage_hash_f1435f49 ON public.easy_thumbnails_thumbnail USING btree (storage_hash);
 C   DROP INDEX public.easy_thumbnails_thumbnail_storage_hash_f1435f49;
       public            taiga    false    301            g           1259    9872996 4   easy_thumbnails_thumbnail_storage_hash_f1435f49_like    INDEX     �   CREATE INDEX easy_thumbnails_thumbnail_storage_hash_f1435f49_like ON public.easy_thumbnails_thumbnail USING btree (storage_hash varchar_pattern_ops);
 H   DROP INDEX public.easy_thumbnails_thumbnail_storage_hash_f1435f49_like;
       public            taiga    false    301                       1259    9872703 "   epics_epic_assigned_to_id_13e08004    INDEX     c   CREATE INDEX epics_epic_assigned_to_id_13e08004 ON public.epics_epic USING btree (assigned_to_id);
 6   DROP INDEX public.epics_epic_assigned_to_id_13e08004;
       public            taiga    false    278                        1259    9872704    epics_epic_owner_id_b09888c4    INDEX     W   CREATE INDEX epics_epic_owner_id_b09888c4 ON public.epics_epic USING btree (owner_id);
 0   DROP INDEX public.epics_epic_owner_id_b09888c4;
       public            taiga    false    278            #           1259    9872705    epics_epic_project_id_d98aaef7    INDEX     [   CREATE INDEX epics_epic_project_id_d98aaef7 ON public.epics_epic USING btree (project_id);
 2   DROP INDEX public.epics_epic_project_id_d98aaef7;
       public            taiga    false    278            $           1259    9872702    epics_epic_ref_aa52eb4a    INDEX     M   CREATE INDEX epics_epic_ref_aa52eb4a ON public.epics_epic USING btree (ref);
 +   DROP INDEX public.epics_epic_ref_aa52eb4a;
       public            taiga    false    278            %           1259    9872706    epics_epic_status_id_4cf3af1a    INDEX     Y   CREATE INDEX epics_epic_status_id_4cf3af1a ON public.epics_epic USING btree (status_id);
 1   DROP INDEX public.epics_epic_status_id_4cf3af1a;
       public            taiga    false    278            &           1259    9872717 '   epics_relateduserstory_epic_id_57605230    INDEX     m   CREATE INDEX epics_relateduserstory_epic_id_57605230 ON public.epics_relateduserstory USING btree (epic_id);
 ;   DROP INDEX public.epics_relateduserstory_epic_id_57605230;
       public            taiga    false    280            )           1259    9872718 -   epics_relateduserstory_user_story_id_329a951c    INDEX     y   CREATE INDEX epics_relateduserstory_user_story_id_329a951c ON public.epics_relateduserstory USING btree (user_story_id);
 A   DROP INDEX public.epics_relateduserstory_user_story_id_329a951c;
       public            taiga    false    280            l           1259    9873064 *   external_apps_application_id_e9988cf8_like    INDEX     �   CREATE INDEX external_apps_application_id_e9988cf8_like ON public.external_apps_application USING btree (id varchar_pattern_ops);
 >   DROP INDEX public.external_apps_application_id_e9988cf8_like;
       public            taiga    false    304            q           1259    9873075 6   external_apps_applicationtoken_application_id_0e934655    INDEX     �   CREATE INDEX external_apps_applicationtoken_application_id_0e934655 ON public.external_apps_applicationtoken USING btree (application_id);
 J   DROP INDEX public.external_apps_applicationtoken_application_id_0e934655;
       public            taiga    false    306            r           1259    9873076 ;   external_apps_applicationtoken_application_id_0e934655_like    INDEX     �   CREATE INDEX external_apps_applicationtoken_application_id_0e934655_like ON public.external_apps_applicationtoken USING btree (application_id varchar_pattern_ops);
 O   DROP INDEX public.external_apps_applicationtoken_application_id_0e934655_like;
       public            taiga    false    306            u           1259    9873077 /   external_apps_applicationtoken_user_id_6e2f1e8a    INDEX     }   CREATE INDEX external_apps_applicationtoken_user_id_6e2f1e8a ON public.external_apps_applicationtoken USING btree (user_id);
 C   DROP INDEX public.external_apps_applicationtoken_user_id_6e2f1e8a;
       public            taiga    false    306                       1259    9872638 %   history_historyentry_id_ff18cc9f_like    INDEX     x   CREATE INDEX history_historyentry_id_ff18cc9f_like ON public.history_historyentry USING btree (id varchar_pattern_ops);
 9   DROP INDEX public.history_historyentry_id_ff18cc9f_like;
       public            taiga    false    276                       1259    9872639 !   history_historyentry_key_c088c4ae    INDEX     a   CREATE INDEX history_historyentry_key_c088c4ae ON public.history_historyentry USING btree (key);
 5   DROP INDEX public.history_historyentry_key_c088c4ae;
       public            taiga    false    276                       1259    9872640 &   history_historyentry_key_c088c4ae_like    INDEX     z   CREATE INDEX history_historyentry_key_c088c4ae_like ON public.history_historyentry USING btree (key varchar_pattern_ops);
 :   DROP INDEX public.history_historyentry_key_c088c4ae_like;
       public            taiga    false    276                       1259    9872641 (   history_historyentry_project_id_9b008f70    INDEX     o   CREATE INDEX history_historyentry_project_id_9b008f70 ON public.history_historyentry USING btree (project_id);
 <   DROP INDEX public.history_historyentry_project_id_9b008f70;
       public            taiga    false    276            �           1259    9871796 $   issues_issue_assigned_to_id_c6054289    INDEX     g   CREATE INDEX issues_issue_assigned_to_id_c6054289 ON public.issues_issue USING btree (assigned_to_id);
 8   DROP INDEX public.issues_issue_assigned_to_id_c6054289;
       public            taiga    false    243            �           1259    9871797 "   issues_issue_milestone_id_3c2695ee    INDEX     c   CREATE INDEX issues_issue_milestone_id_3c2695ee ON public.issues_issue USING btree (milestone_id);
 6   DROP INDEX public.issues_issue_milestone_id_3c2695ee;
       public            taiga    false    243            �           1259    9871798    issues_issue_owner_id_5c361b47    INDEX     [   CREATE INDEX issues_issue_owner_id_5c361b47 ON public.issues_issue USING btree (owner_id);
 2   DROP INDEX public.issues_issue_owner_id_5c361b47;
       public            taiga    false    243            �           1259    9871799 !   issues_issue_priority_id_93842a93    INDEX     a   CREATE INDEX issues_issue_priority_id_93842a93 ON public.issues_issue USING btree (priority_id);
 5   DROP INDEX public.issues_issue_priority_id_93842a93;
       public            taiga    false    243            �           1259    9871800     issues_issue_project_id_4b0f3e2f    INDEX     _   CREATE INDEX issues_issue_project_id_4b0f3e2f ON public.issues_issue USING btree (project_id);
 4   DROP INDEX public.issues_issue_project_id_4b0f3e2f;
       public            taiga    false    243            �           1259    9871795    issues_issue_ref_4c1e7f8f    INDEX     Q   CREATE INDEX issues_issue_ref_4c1e7f8f ON public.issues_issue USING btree (ref);
 -   DROP INDEX public.issues_issue_ref_4c1e7f8f;
       public            taiga    false    243            �           1259    9871801 !   issues_issue_severity_id_695dade0    INDEX     a   CREATE INDEX issues_issue_severity_id_695dade0 ON public.issues_issue USING btree (severity_id);
 5   DROP INDEX public.issues_issue_severity_id_695dade0;
       public            taiga    false    243            �           1259    9871802    issues_issue_status_id_64473cf1    INDEX     ]   CREATE INDEX issues_issue_status_id_64473cf1 ON public.issues_issue USING btree (status_id);
 3   DROP INDEX public.issues_issue_status_id_64473cf1;
       public            taiga    false    243            �           1259    9871803    issues_issue_type_id_c1063362    INDEX     Y   CREATE INDEX issues_issue_type_id_c1063362 ON public.issues_issue USING btree (type_id);
 1   DROP INDEX public.issues_issue_type_id_c1063362;
       public            taiga    false    243            �           1259    9872356 #   likes_like_content_type_id_8ffc2116    INDEX     e   CREATE INDEX likes_like_content_type_id_8ffc2116 ON public.likes_like USING btree (content_type_id);
 7   DROP INDEX public.likes_like_content_type_id_8ffc2116;
       public            taiga    false    267            �           1259    9872357    likes_like_user_id_aae4c421    INDEX     U   CREATE INDEX likes_like_user_id_aae4c421 ON public.likes_like USING btree (user_id);
 /   DROP INDEX public.likes_like_user_id_aae4c421;
       public            taiga    false    267            �           1259    9871716 "   milestones_milestone_name_23fb0698    INDEX     c   CREATE INDEX milestones_milestone_name_23fb0698 ON public.milestones_milestone USING btree (name);
 6   DROP INDEX public.milestones_milestone_name_23fb0698;
       public            taiga    false    241            �           1259    9871717 '   milestones_milestone_name_23fb0698_like    INDEX     |   CREATE INDEX milestones_milestone_name_23fb0698_like ON public.milestones_milestone USING btree (name varchar_pattern_ops);
 ;   DROP INDEX public.milestones_milestone_name_23fb0698_like;
       public            taiga    false    241            �           1259    9871720 &   milestones_milestone_owner_id_216ba23b    INDEX     k   CREATE INDEX milestones_milestone_owner_id_216ba23b ON public.milestones_milestone USING btree (owner_id);
 :   DROP INDEX public.milestones_milestone_owner_id_216ba23b;
       public            taiga    false    241            �           1259    9871721 (   milestones_milestone_project_id_6151cb75    INDEX     o   CREATE INDEX milestones_milestone_project_id_6151cb75 ON public.milestones_milestone USING btree (project_id);
 <   DROP INDEX public.milestones_milestone_project_id_6151cb75;
       public            taiga    false    241            �           1259    9871718 "   milestones_milestone_slug_08e5995e    INDEX     c   CREATE INDEX milestones_milestone_slug_08e5995e ON public.milestones_milestone USING btree (slug);
 6   DROP INDEX public.milestones_milestone_slug_08e5995e;
       public            taiga    false    241            �           1259    9871719 '   milestones_milestone_slug_08e5995e_like    INDEX     |   CREATE INDEX milestones_milestone_slug_08e5995e_like ON public.milestones_milestone USING btree (slug varchar_pattern_ops);
 ;   DROP INDEX public.milestones_milestone_slug_08e5995e_like;
       public            taiga    false    241            �           1259    9872046 6   notifications_historycha_historyentry_id_ad550852_like    INDEX     �   CREATE INDEX notifications_historycha_historyentry_id_ad550852_like ON public.notifications_historychangenotification_history_entries USING btree (historyentry_id varchar_pattern_ops);
 J   DROP INDEX public.notifications_historycha_historyentry_id_ad550852_like;
       public            taiga    false    253            �           1259    9872044 >   notifications_historychang_historychangenotification__65e52ffd    INDEX     �   CREATE INDEX notifications_historychang_historychangenotification__65e52ffd ON public.notifications_historychangenotification_history_entries USING btree (historychangenotification_id);
 R   DROP INDEX public.notifications_historychang_historychangenotification__65e52ffd;
       public            taiga    false    253            �           1259    9872059 >   notifications_historychang_historychangenotification__d8e98e97    INDEX     �   CREATE INDEX notifications_historychang_historychangenotification__d8e98e97 ON public.notifications_historychangenotification_notify_users USING btree (historychangenotification_id);
 R   DROP INDEX public.notifications_historychang_historychangenotification__d8e98e97;
       public            taiga    false    255            �           1259    9872045 3   notifications_historychang_historyentry_id_ad550852    INDEX     �   CREATE INDEX notifications_historychang_historyentry_id_ad550852 ON public.notifications_historychangenotification_history_entries USING btree (historyentry_id);
 G   DROP INDEX public.notifications_historychang_historyentry_id_ad550852;
       public            taiga    false    253            �           1259    9872060 +   notifications_historychang_user_id_f7bd2448    INDEX     �   CREATE INDEX notifications_historychang_user_id_f7bd2448 ON public.notifications_historychangenotification_notify_users USING btree (user_id);
 ?   DROP INDEX public.notifications_historychang_user_id_f7bd2448;
       public            taiga    false    255            �           1259    9872030 9   notifications_historychangenotification_owner_id_6f63be8a    INDEX     �   CREATE INDEX notifications_historychangenotification_owner_id_6f63be8a ON public.notifications_historychangenotification USING btree (owner_id);
 M   DROP INDEX public.notifications_historychangenotification_owner_id_6f63be8a;
       public            taiga    false    251            �           1259    9872031 ;   notifications_historychangenotification_project_id_52cf5e2b    INDEX     �   CREATE INDEX notifications_historychangenotification_project_id_52cf5e2b ON public.notifications_historychangenotification USING btree (project_id);
 O   DROP INDEX public.notifications_historychangenotification_project_id_52cf5e2b;
       public            taiga    false    251            �           1259    9871973 .   notifications_notifypolicy_project_id_aa5da43f    INDEX     {   CREATE INDEX notifications_notifypolicy_project_id_aa5da43f ON public.notifications_notifypolicy USING btree (project_id);
 B   DROP INDEX public.notifications_notifypolicy_project_id_aa5da43f;
       public            taiga    false    249            �           1259    9871974 +   notifications_notifypolicy_user_id_2902cbeb    INDEX     u   CREATE INDEX notifications_notifypolicy_user_id_2902cbeb ON public.notifications_notifypolicy USING btree (user_id);
 ?   DROP INDEX public.notifications_notifypolicy_user_id_2902cbeb;
       public            taiga    false    249            �           1259    9872089 .   notifications_watched_content_type_id_7b3ab729    INDEX     {   CREATE INDEX notifications_watched_content_type_id_7b3ab729 ON public.notifications_watched USING btree (content_type_id);
 B   DROP INDEX public.notifications_watched_content_type_id_7b3ab729;
       public            taiga    false    257            �           1259    9872091 )   notifications_watched_project_id_c88baa46    INDEX     q   CREATE INDEX notifications_watched_project_id_c88baa46 ON public.notifications_watched USING btree (project_id);
 =   DROP INDEX public.notifications_watched_project_id_c88baa46;
       public            taiga    false    257            �           1259    9872090 &   notifications_watched_user_id_1bce1955    INDEX     k   CREATE INDEX notifications_watched_user_id_1bce1955 ON public.notifications_watched USING btree (user_id);
 :   DROP INDEX public.notifications_watched_user_id_1bce1955;
       public            taiga    false    257            x           1259    9873155 .   notifications_webnotification_created_b17f50f8    INDEX     {   CREATE INDEX notifications_webnotification_created_b17f50f8 ON public.notifications_webnotification USING btree (created);
 B   DROP INDEX public.notifications_webnotification_created_b17f50f8;
       public            taiga    false    310            {           1259    9873156 .   notifications_webnotification_user_id_f32287d5    INDEX     {   CREATE INDEX notifications_webnotification_user_id_f32287d5 ON public.notifications_webnotification USING btree (user_id);
 B   DROP INDEX public.notifications_webnotification_user_id_f32287d5;
       public            taiga    false    310            �           1259    9872451 '   projects_epicstatus_project_id_d2c43c29    INDEX     m   CREATE INDEX projects_epicstatus_project_id_d2c43c29 ON public.projects_epicstatus USING btree (project_id);
 ;   DROP INDEX public.projects_epicstatus_project_id_d2c43c29;
       public            taiga    false    269                       1259    9872449 !   projects_epicstatus_slug_63c476c8    INDEX     a   CREATE INDEX projects_epicstatus_slug_63c476c8 ON public.projects_epicstatus USING btree (slug);
 5   DROP INDEX public.projects_epicstatus_slug_63c476c8;
       public            taiga    false    269                       1259    9872450 &   projects_epicstatus_slug_63c476c8_like    INDEX     z   CREATE INDEX projects_epicstatus_slug_63c476c8_like ON public.projects_epicstatus USING btree (slug varchar_pattern_ops);
 :   DROP INDEX public.projects_epicstatus_slug_63c476c8_like;
       public            taiga    false    269            �           1259    9873215 )   projects_issueduedate_project_id_ec077eb7    INDEX     q   CREATE INDEX projects_issueduedate_project_id_ec077eb7 ON public.projects_issueduedate USING btree (project_id);
 =   DROP INDEX public.projects_issueduedate_project_id_ec077eb7;
       public            taiga    false    314            E           1259    9871499 (   projects_issuestatus_project_id_1988ebf4    INDEX     o   CREATE INDEX projects_issuestatus_project_id_1988ebf4 ON public.projects_issuestatus USING btree (project_id);
 <   DROP INDEX public.projects_issuestatus_project_id_1988ebf4;
       public            taiga    false    217            J           1259    9872232 "   projects_issuestatus_slug_2c528947    INDEX     c   CREATE INDEX projects_issuestatus_slug_2c528947 ON public.projects_issuestatus USING btree (slug);
 6   DROP INDEX public.projects_issuestatus_slug_2c528947;
       public            taiga    false    217            K           1259    9872233 '   projects_issuestatus_slug_2c528947_like    INDEX     |   CREATE INDEX projects_issuestatus_slug_2c528947_like ON public.projects_issuestatus USING btree (slug varchar_pattern_ops);
 ;   DROP INDEX public.projects_issuestatus_slug_2c528947_like;
       public            taiga    false    217            N           1259    9871505 &   projects_issuetype_project_id_e831e4ae    INDEX     k   CREATE INDEX projects_issuetype_project_id_e831e4ae ON public.projects_issuetype USING btree (project_id);
 :   DROP INDEX public.projects_issuetype_project_id_e831e4ae;
       public            taiga    false    219                       1259    9871944 *   projects_membership_invited_by_id_a2c6c913    INDEX     s   CREATE INDEX projects_membership_invited_by_id_a2c6c913 ON public.projects_membership USING btree (invited_by_id);
 >   DROP INDEX public.projects_membership_invited_by_id_a2c6c913;
       public            taiga    false    213                       1259    9871385 '   projects_membership_project_id_5f65bf3f    INDEX     m   CREATE INDEX projects_membership_project_id_5f65bf3f ON public.projects_membership USING btree (project_id);
 ;   DROP INDEX public.projects_membership_project_id_5f65bf3f;
       public            taiga    false    213                       1259    9871391 $   projects_membership_role_id_c4bd36ef    INDEX     g   CREATE INDEX projects_membership_role_id_c4bd36ef ON public.projects_membership USING btree (role_id);
 8   DROP INDEX public.projects_membership_role_id_c4bd36ef;
       public            taiga    false    213                       1259    9871379 $   projects_membership_user_id_13374535    INDEX     g   CREATE INDEX projects_membership_user_id_13374535 ON public.projects_membership USING btree (user_id);
 8   DROP INDEX public.projects_membership_user_id_13374535;
       public            taiga    false    213            S           1259    9871511 #   projects_points_project_id_3b8f7b42    INDEX     e   CREATE INDEX projects_points_project_id_3b8f7b42 ON public.projects_points USING btree (project_id);
 7   DROP INDEX public.projects_points_project_id_3b8f7b42;
       public            taiga    false    221            X           1259    9871517 %   projects_priority_project_id_936c75b2    INDEX     i   CREATE INDEX projects_priority_project_id_936c75b2 ON public.projects_priority USING btree (project_id);
 9   DROP INDEX public.projects_priority_project_id_936c75b2;
       public            taiga    false    223                       1259    9871537 .   projects_project_creation_template_id_b5a97819    INDEX     {   CREATE INDEX projects_project_creation_template_id_b5a97819 ON public.projects_project USING btree (creation_template_id);
 B   DROP INDEX public.projects_project_creation_template_id_b5a97819;
       public            taiga    false    215            )           1259    9872462 (   projects_project_epics_csv_uuid_cb50f2ee    INDEX     o   CREATE INDEX projects_project_epics_csv_uuid_cb50f2ee ON public.projects_project USING btree (epics_csv_uuid);
 <   DROP INDEX public.projects_project_epics_csv_uuid_cb50f2ee;
       public            taiga    false    215            *           1259    9872463 -   projects_project_epics_csv_uuid_cb50f2ee_like    INDEX     �   CREATE INDEX projects_project_epics_csv_uuid_cb50f2ee_like ON public.projects_project USING btree (epics_csv_uuid varchar_pattern_ops);
 A   DROP INDEX public.projects_project_epics_csv_uuid_cb50f2ee_like;
       public            taiga    false    215            +           1259    9872267 )   projects_project_issues_csv_uuid_e6a84723    INDEX     q   CREATE INDEX projects_project_issues_csv_uuid_e6a84723 ON public.projects_project USING btree (issues_csv_uuid);
 =   DROP INDEX public.projects_project_issues_csv_uuid_e6a84723;
       public            taiga    false    215            ,           1259    9872268 .   projects_project_issues_csv_uuid_e6a84723_like    INDEX     �   CREATE INDEX projects_project_issues_csv_uuid_e6a84723_like ON public.projects_project USING btree (issues_csv_uuid varchar_pattern_ops);
 B   DROP INDEX public.projects_project_issues_csv_uuid_e6a84723_like;
       public            taiga    false    215            -           1259    9872390 %   projects_project_name_id_44f44a5f_idx    INDEX     f   CREATE INDEX projects_project_name_id_44f44a5f_idx ON public.projects_project USING btree (name, id);
 9   DROP INDEX public.projects_project_name_id_44f44a5f_idx;
       public            taiga    false    215    215            .           1259    9871373 "   projects_project_owner_id_b940de39    INDEX     c   CREATE INDEX projects_project_owner_id_b940de39 ON public.projects_project USING btree (owner_id);
 6   DROP INDEX public.projects_project_owner_id_b940de39;
       public            taiga    false    215            1           1259    9871372 #   projects_project_slug_2d50067a_like    INDEX     t   CREATE INDEX projects_project_slug_2d50067a_like ON public.projects_project USING btree (slug varchar_pattern_ops);
 7   DROP INDEX public.projects_project_slug_2d50067a_like;
       public            taiga    false    215            4           1259    9872269 (   projects_project_tasks_csv_uuid_ecd0b1b5    INDEX     o   CREATE INDEX projects_project_tasks_csv_uuid_ecd0b1b5 ON public.projects_project USING btree (tasks_csv_uuid);
 <   DROP INDEX public.projects_project_tasks_csv_uuid_ecd0b1b5;
       public            taiga    false    215            5           1259    9872270 -   projects_project_tasks_csv_uuid_ecd0b1b5_like    INDEX     �   CREATE INDEX projects_project_tasks_csv_uuid_ecd0b1b5_like ON public.projects_project USING btree (tasks_csv_uuid varchar_pattern_ops);
 A   DROP INDEX public.projects_project_tasks_csv_uuid_ecd0b1b5_like;
       public            taiga    false    215            6           1259    9873175    projects_project_textquery_idx    INDEX     �  CREATE INDEX projects_project_textquery_idx ON public.projects_project USING gin ((((setweight(to_tsvector('simple'::regconfig, (COALESCE(name, ''::character varying))::text), 'A'::"char") || setweight(to_tsvector('simple'::regconfig, COALESCE(public.inmutable_array_to_string(tags), ''::text)), 'B'::"char")) || setweight(to_tsvector('simple'::regconfig, COALESCE(description, ''::text)), 'C'::"char"))));
 2   DROP INDEX public.projects_project_textquery_idx;
       public            taiga    false    374    215    215    215    215            7           1259    9872381 (   projects_project_total_activity_edf1a486    INDEX     o   CREATE INDEX projects_project_total_activity_edf1a486 ON public.projects_project USING btree (total_activity);
 <   DROP INDEX public.projects_project_total_activity_edf1a486;
       public            taiga    false    215            8           1259    9872382 3   projects_project_total_activity_last_month_669bff3e    INDEX     �   CREATE INDEX projects_project_total_activity_last_month_669bff3e ON public.projects_project USING btree (total_activity_last_month);
 G   DROP INDEX public.projects_project_total_activity_last_month_669bff3e;
       public            taiga    false    215            9           1259    9872383 2   projects_project_total_activity_last_week_961ca1b0    INDEX     �   CREATE INDEX projects_project_total_activity_last_week_961ca1b0 ON public.projects_project USING btree (total_activity_last_week);
 F   DROP INDEX public.projects_project_total_activity_last_week_961ca1b0;
       public            taiga    false    215            :           1259    9872384 2   projects_project_total_activity_last_year_12ea6dbe    INDEX     �   CREATE INDEX projects_project_total_activity_last_year_12ea6dbe ON public.projects_project USING btree (total_activity_last_year);
 F   DROP INDEX public.projects_project_total_activity_last_year_12ea6dbe;
       public            taiga    false    215            ;           1259    9872385 $   projects_project_total_fans_436fe323    INDEX     g   CREATE INDEX projects_project_total_fans_436fe323 ON public.projects_project USING btree (total_fans);
 8   DROP INDEX public.projects_project_total_fans_436fe323;
       public            taiga    false    215            <           1259    9872386 /   projects_project_total_fans_last_month_455afdbb    INDEX     }   CREATE INDEX projects_project_total_fans_last_month_455afdbb ON public.projects_project USING btree (total_fans_last_month);
 C   DROP INDEX public.projects_project_total_fans_last_month_455afdbb;
       public            taiga    false    215            =           1259    9872387 .   projects_project_total_fans_last_week_c65146b1    INDEX     {   CREATE INDEX projects_project_total_fans_last_week_c65146b1 ON public.projects_project USING btree (total_fans_last_week);
 B   DROP INDEX public.projects_project_total_fans_last_week_c65146b1;
       public            taiga    false    215            >           1259    9872388 .   projects_project_total_fans_last_year_167b29c2    INDEX     {   CREATE INDEX projects_project_total_fans_last_year_167b29c2 ON public.projects_project USING btree (total_fans_last_year);
 B   DROP INDEX public.projects_project_total_fans_last_year_167b29c2;
       public            taiga    false    215            ?           1259    9872389 1   projects_project_totals_updated_datetime_1bcc5bfa    INDEX     �   CREATE INDEX projects_project_totals_updated_datetime_1bcc5bfa ON public.projects_project USING btree (totals_updated_datetime);
 E   DROP INDEX public.projects_project_totals_updated_datetime_1bcc5bfa;
       public            taiga    false    215            @           1259    9872271 .   projects_project_userstories_csv_uuid_6e83c6c1    INDEX     {   CREATE INDEX projects_project_userstories_csv_uuid_6e83c6c1 ON public.projects_project USING btree (userstories_csv_uuid);
 B   DROP INDEX public.projects_project_userstories_csv_uuid_6e83c6c1;
       public            taiga    false    215            A           1259    9872272 3   projects_project_userstories_csv_uuid_6e83c6c1_like    INDEX     �   CREATE INDEX projects_project_userstories_csv_uuid_6e83c6c1_like ON public.projects_project USING btree (userstories_csv_uuid varchar_pattern_ops);
 G   DROP INDEX public.projects_project_userstories_csv_uuid_6e83c6c1_like;
       public            taiga    false    215            B           1259    9873283 &   projects_project_workspace_id_7ea54f67    INDEX     k   CREATE INDEX projects_project_workspace_id_7ea54f67 ON public.projects_project USING btree (workspace_id);
 :   DROP INDEX public.projects_project_workspace_id_7ea54f67;
       public            taiga    false    215            ]           1259    9871518 +   projects_projecttemplate_slug_2731738e_like    INDEX     �   CREATE INDEX projects_projecttemplate_slug_2731738e_like ON public.projects_projecttemplate USING btree (slug varchar_pattern_ops);
 ?   DROP INDEX public.projects_projecttemplate_slug_2731738e_like;
       public            taiga    false    225            b           1259    9871524 %   projects_severity_project_id_9ab920cd    INDEX     i   CREATE INDEX projects_severity_project_id_9ab920cd ON public.projects_severity USING btree (project_id);
 9   DROP INDEX public.projects_severity_project_id_9ab920cd;
       public            taiga    false    227            �           1259    9873251 %   projects_swimlane_project_id_06871cf8    INDEX     i   CREATE INDEX projects_swimlane_project_id_06871cf8 ON public.projects_swimlane USING btree (project_id);
 9   DROP INDEX public.projects_swimlane_project_id_06871cf8;
       public            taiga    false    320            �           1259    9873272 3   projects_swimlaneuserstorystatus_status_id_2f3fda91    INDEX     �   CREATE INDEX projects_swimlaneuserstorystatus_status_id_2f3fda91 ON public.projects_swimlaneuserstorystatus USING btree (status_id);
 G   DROP INDEX public.projects_swimlaneuserstorystatus_status_id_2f3fda91;
       public            taiga    false    322            �           1259    9873273 5   projects_swimlaneuserstorystatus_swimlane_id_1d3f2b21    INDEX     �   CREATE INDEX projects_swimlaneuserstorystatus_swimlane_id_1d3f2b21 ON public.projects_swimlaneuserstorystatus USING btree (swimlane_id);
 I   DROP INDEX public.projects_swimlaneuserstorystatus_swimlane_id_1d3f2b21;
       public            taiga    false    322            �           1259    9873221 (   projects_taskduedate_project_id_775d850d    INDEX     o   CREATE INDEX projects_taskduedate_project_id_775d850d ON public.projects_taskduedate USING btree (project_id);
 <   DROP INDEX public.projects_taskduedate_project_id_775d850d;
       public            taiga    false    316            g           1259    9871530 '   projects_taskstatus_project_id_8b32b2bb    INDEX     m   CREATE INDEX projects_taskstatus_project_id_8b32b2bb ON public.projects_taskstatus USING btree (project_id);
 ;   DROP INDEX public.projects_taskstatus_project_id_8b32b2bb;
       public            taiga    false    229            l           1259    9872234 !   projects_taskstatus_slug_cf358ffa    INDEX     a   CREATE INDEX projects_taskstatus_slug_cf358ffa ON public.projects_taskstatus USING btree (slug);
 5   DROP INDEX public.projects_taskstatus_slug_cf358ffa;
       public            taiga    false    229            m           1259    9872235 &   projects_taskstatus_slug_cf358ffa_like    INDEX     z   CREATE INDEX projects_taskstatus_slug_cf358ffa_like ON public.projects_taskstatus USING btree (slug varchar_pattern_ops);
 :   DROP INDEX public.projects_taskstatus_slug_cf358ffa_like;
       public            taiga    false    229            �           1259    9873227 -   projects_userstoryduedate_project_id_ab7b1680    INDEX     y   CREATE INDEX projects_userstoryduedate_project_id_ab7b1680 ON public.projects_userstoryduedate USING btree (project_id);
 A   DROP INDEX public.projects_userstoryduedate_project_id_ab7b1680;
       public            taiga    false    318            p           1259    9871536 ,   projects_userstorystatus_project_id_cdf95c9c    INDEX     w   CREATE INDEX projects_userstorystatus_project_id_cdf95c9c ON public.projects_userstorystatus USING btree (project_id);
 @   DROP INDEX public.projects_userstorystatus_project_id_cdf95c9c;
       public            taiga    false    231            u           1259    9872236 &   projects_userstorystatus_slug_d574ed51    INDEX     k   CREATE INDEX projects_userstorystatus_slug_d574ed51 ON public.projects_userstorystatus USING btree (slug);
 :   DROP INDEX public.projects_userstorystatus_slug_d574ed51;
       public            taiga    false    231            v           1259    9872237 +   projects_userstorystatus_slug_d574ed51_like    INDEX     �   CREATE INDEX projects_userstorystatus_slug_d574ed51_like ON public.projects_userstorystatus USING btree (slug varchar_pattern_ops);
 ?   DROP INDEX public.projects_userstorystatus_slug_d574ed51_like;
       public            taiga    false    231            �           1259    9873312 -   references_reference_content_type_id_c134e05e    INDEX     y   CREATE INDEX references_reference_content_type_id_c134e05e ON public.references_reference USING btree (content_type_id);
 A   DROP INDEX public.references_reference_content_type_id_c134e05e;
       public            taiga    false    324            �           1259    9873313 (   references_reference_project_id_00275368    INDEX     o   CREATE INDEX references_reference_project_id_00275368 ON public.references_reference USING btree (project_id);
 <   DROP INDEX public.references_reference_project_id_00275368;
       public            taiga    false    324            �           1259    9873344 0   settings_userprojectsettings_project_id_0bc686ce    INDEX        CREATE INDEX settings_userprojectsettings_project_id_0bc686ce ON public.settings_userprojectsettings USING btree (project_id);
 D   DROP INDEX public.settings_userprojectsettings_project_id_0bc686ce;
       public            taiga    false    327            �           1259    9873345 -   settings_userprojectsettings_user_id_0e7fdc25    INDEX     y   CREATE INDEX settings_userprojectsettings_user_id_0e7fdc25 ON public.settings_userprojectsettings USING btree (user_id);
 A   DROP INDEX public.settings_userprojectsettings_user_id_0e7fdc25;
       public            taiga    false    327            �           1259    9872142 "   tasks_task_assigned_to_id_e8821f61    INDEX     c   CREATE INDEX tasks_task_assigned_to_id_e8821f61 ON public.tasks_task USING btree (assigned_to_id);
 6   DROP INDEX public.tasks_task_assigned_to_id_e8821f61;
       public            taiga    false    259            �           1259    9872143     tasks_task_milestone_id_64cc568f    INDEX     _   CREATE INDEX tasks_task_milestone_id_64cc568f ON public.tasks_task USING btree (milestone_id);
 4   DROP INDEX public.tasks_task_milestone_id_64cc568f;
       public            taiga    false    259            �           1259    9872144    tasks_task_owner_id_db3dcc3e    INDEX     W   CREATE INDEX tasks_task_owner_id_db3dcc3e ON public.tasks_task USING btree (owner_id);
 0   DROP INDEX public.tasks_task_owner_id_db3dcc3e;
       public            taiga    false    259            �           1259    9872145    tasks_task_project_id_a2815f0c    INDEX     [   CREATE INDEX tasks_task_project_id_a2815f0c ON public.tasks_task USING btree (project_id);
 2   DROP INDEX public.tasks_task_project_id_a2815f0c;
       public            taiga    false    259            �           1259    9872141    tasks_task_ref_9f55bd37    INDEX     M   CREATE INDEX tasks_task_ref_9f55bd37 ON public.tasks_task USING btree (ref);
 +   DROP INDEX public.tasks_task_ref_9f55bd37;
       public            taiga    false    259            �           1259    9872146    tasks_task_status_id_899d2b90    INDEX     Y   CREATE INDEX tasks_task_status_id_899d2b90 ON public.tasks_task USING btree (status_id);
 1   DROP INDEX public.tasks_task_status_id_899d2b90;
       public            taiga    false    259            �           1259    9872147 !   tasks_task_user_story_id_47ceaf1d    INDEX     a   CREATE INDEX tasks_task_user_story_id_47ceaf1d ON public.tasks_task USING btree (user_story_id);
 5   DROP INDEX public.tasks_task_user_story_id_47ceaf1d;
       public            taiga    false    259            �           1259    9873407    timeline_ti_content_1af26f_idx    INDEX     �   CREATE INDEX timeline_ti_content_1af26f_idx ON public.timeline_timeline USING btree (content_type_id, object_id, created DESC);
 2   DROP INDEX public.timeline_ti_content_1af26f_idx;
       public            taiga    false    265    265    265            �           1259    9873406    timeline_ti_namespa_89bca1_idx    INDEX     o   CREATE INDEX timeline_ti_namespa_89bca1_idx ON public.timeline_timeline USING btree (namespace, created DESC);
 2   DROP INDEX public.timeline_ti_namespa_89bca1_idx;
       public            taiga    false    265    265            �           1259    9872307 *   timeline_timeline_content_type_id_5731a0c6    INDEX     s   CREATE INDEX timeline_timeline_content_type_id_5731a0c6 ON public.timeline_timeline USING btree (content_type_id);
 >   DROP INDEX public.timeline_timeline_content_type_id_5731a0c6;
       public            taiga    false    265            �           1259    9873388 "   timeline_timeline_created_4e9e3a68    INDEX     c   CREATE INDEX timeline_timeline_created_4e9e3a68 ON public.timeline_timeline USING btree (created);
 6   DROP INDEX public.timeline_timeline_created_4e9e3a68;
       public            taiga    false    265            �           1259    9872306 /   timeline_timeline_data_content_type_id_0689742e    INDEX     }   CREATE INDEX timeline_timeline_data_content_type_id_0689742e ON public.timeline_timeline USING btree (data_content_type_id);
 C   DROP INDEX public.timeline_timeline_data_content_type_id_0689742e;
       public            taiga    false    265            �           1259    9872308 %   timeline_timeline_event_type_cb2fcdb2    INDEX     i   CREATE INDEX timeline_timeline_event_type_cb2fcdb2 ON public.timeline_timeline USING btree (event_type);
 9   DROP INDEX public.timeline_timeline_event_type_cb2fcdb2;
       public            taiga    false    265            �           1259    9872309 *   timeline_timeline_event_type_cb2fcdb2_like    INDEX     �   CREATE INDEX timeline_timeline_event_type_cb2fcdb2_like ON public.timeline_timeline USING btree (event_type varchar_pattern_ops);
 >   DROP INDEX public.timeline_timeline_event_type_cb2fcdb2_like;
       public            taiga    false    265            �           1259    9872311 $   timeline_timeline_namespace_26f217ed    INDEX     g   CREATE INDEX timeline_timeline_namespace_26f217ed ON public.timeline_timeline USING btree (namespace);
 8   DROP INDEX public.timeline_timeline_namespace_26f217ed;
       public            taiga    false    265            �           1259    9872312 )   timeline_timeline_namespace_26f217ed_like    INDEX     �   CREATE INDEX timeline_timeline_namespace_26f217ed_like ON public.timeline_timeline USING btree (namespace varchar_pattern_ops);
 =   DROP INDEX public.timeline_timeline_namespace_26f217ed_like;
       public            taiga    false    265            �           1259    9872305 %   timeline_timeline_project_id_58d5eadd    INDEX     i   CREATE INDEX timeline_timeline_project_id_58d5eadd ON public.timeline_timeline USING btree (project_id);
 9   DROP INDEX public.timeline_timeline_project_id_58d5eadd;
       public            taiga    false    265            �           1259    9873436 1   token_denylist_outstandingtoken_jti_70fa66b5_like    INDEX     �   CREATE INDEX token_denylist_outstandingtoken_jti_70fa66b5_like ON public.token_denylist_outstandingtoken USING btree (jti varchar_pattern_ops);
 E   DROP INDEX public.token_denylist_outstandingtoken_jti_70fa66b5_like;
       public            taiga    false    331            �           1259    9873437 0   token_denylist_outstandingtoken_user_id_c6f48986    INDEX        CREATE INDEX token_denylist_outstandingtoken_user_id_c6f48986 ON public.token_denylist_outstandingtoken USING btree (user_id);
 D   DROP INDEX public.token_denylist_outstandingtoken_user_id_c6f48986;
       public            taiga    false    331            �           1259    9872192    users_authdata_key_c3b89eef    INDEX     U   CREATE INDEX users_authdata_key_c3b89eef ON public.users_authdata USING btree (key);
 /   DROP INDEX public.users_authdata_key_c3b89eef;
       public            taiga    false    261            �           1259    9872193     users_authdata_key_c3b89eef_like    INDEX     n   CREATE INDEX users_authdata_key_c3b89eef_like ON public.users_authdata USING btree (key varchar_pattern_ops);
 4   DROP INDEX public.users_authdata_key_c3b89eef_like;
       public            taiga    false    261            �           1259    9872194    users_authdata_user_id_9625853a    INDEX     ]   CREATE INDEX users_authdata_user_id_9625853a ON public.users_authdata USING btree (user_id);
 3   DROP INDEX public.users_authdata_user_id_9625853a;
       public            taiga    false    261            	           1259    9871671    users_role_project_id_2837f877    INDEX     [   CREATE INDEX users_role_project_id_2837f877 ON public.users_role USING btree (project_id);
 2   DROP INDEX public.users_role_project_id_2837f877;
       public            taiga    false    211            
           1259    9871342    users_role_slug_ce33b471    INDEX     O   CREATE INDEX users_role_slug_ce33b471 ON public.users_role USING btree (slug);
 ,   DROP INDEX public.users_role_slug_ce33b471;
       public            taiga    false    211                       1259    9871343    users_role_slug_ce33b471_like    INDEX     h   CREATE INDEX users_role_slug_ce33b471_like ON public.users_role USING btree (slug varchar_pattern_ops);
 1   DROP INDEX public.users_role_slug_ce33b471_like;
       public            taiga    false    211            �           1259    9871679    users_user_email_243f6e77_like    INDEX     j   CREATE INDEX users_user_email_243f6e77_like ON public.users_user USING btree (email varchar_pattern_ops);
 2   DROP INDEX public.users_user_email_243f6e77_like;
       public            taiga    false    207            �           1259    9873454    users_user_upper_idx    INDEX     ^   CREATE INDEX users_user_upper_idx ON public.users_user USING btree (upper('username'::text));
 (   DROP INDEX public.users_user_upper_idx;
       public            taiga    false    207            �           1259    9873455    users_user_upper_idx1    INDEX     \   CREATE INDEX users_user_upper_idx1 ON public.users_user USING btree (upper('email'::text));
 )   DROP INDEX public.users_user_upper_idx1;
       public            taiga    false    207            �           1259    9871682 !   users_user_username_06e46fe6_like    INDEX     p   CREATE INDEX users_user_username_06e46fe6_like ON public.users_user USING btree (username varchar_pattern_ops);
 5   DROP INDEX public.users_user_username_06e46fe6_like;
       public            taiga    false    207                        1259    9873459    users_user_uuid_6fe513d7_like    INDEX     h   CREATE INDEX users_user_uuid_6fe513d7_like ON public.users_user USING btree (uuid varchar_pattern_ops);
 1   DROP INDEX public.users_user_uuid_6fe513d7_like;
       public            taiga    false    207            �           1259    9873483 !   users_workspacerole_slug_2db99758    INDEX     a   CREATE INDEX users_workspacerole_slug_2db99758 ON public.users_workspacerole USING btree (slug);
 5   DROP INDEX public.users_workspacerole_slug_2db99758;
       public            taiga    false    335            �           1259    9873484 &   users_workspacerole_slug_2db99758_like    INDEX     z   CREATE INDEX users_workspacerole_slug_2db99758_like ON public.users_workspacerole USING btree (slug varchar_pattern_ops);
 :   DROP INDEX public.users_workspacerole_slug_2db99758_like;
       public            taiga    false    335            �           1259    9873485 )   users_workspacerole_workspace_id_30155f00    INDEX     q   CREATE INDEX users_workspacerole_workspace_id_30155f00 ON public.users_workspacerole USING btree (workspace_id);
 =   DROP INDEX public.users_workspacerole_workspace_id_30155f00;
       public            taiga    false    335            �           1259    9873504 *   userstorage_storageentry_owner_id_c4c1ffc0    INDEX     s   CREATE INDEX userstorage_storageentry_owner_id_c4c1ffc0 ON public.userstorage_storageentry USING btree (owner_id);
 >   DROP INDEX public.userstorage_storageentry_owner_id_c4c1ffc0;
       public            taiga    false    337            �           1259    9871858 )   userstories_rolepoints_points_id_cfcc5a79    INDEX     q   CREATE INDEX userstories_rolepoints_points_id_cfcc5a79 ON public.userstories_rolepoints USING btree (points_id);
 =   DROP INDEX public.userstories_rolepoints_points_id_cfcc5a79;
       public            taiga    false    245            �           1259    9871859 '   userstories_rolepoints_role_id_94ac7663    INDEX     m   CREATE INDEX userstories_rolepoints_role_id_94ac7663 ON public.userstories_rolepoints USING btree (role_id);
 ;   DROP INDEX public.userstories_rolepoints_role_id_94ac7663;
       public            taiga    false    245            �           1259    9871911 -   userstories_rolepoints_user_story_id_ddb4c558    INDEX     y   CREATE INDEX userstories_rolepoints_user_story_id_ddb4c558 ON public.userstories_rolepoints USING btree (user_story_id);
 A   DROP INDEX public.userstories_rolepoints_user_story_id_ddb4c558;
       public            taiga    false    245            �           1259    9871891 -   userstories_userstory_assigned_to_id_5ba80653    INDEX     y   CREATE INDEX userstories_userstory_assigned_to_id_5ba80653 ON public.userstories_userstory USING btree (assigned_to_id);
 A   DROP INDEX public.userstories_userstory_assigned_to_id_5ba80653;
       public            taiga    false    247            �           1259    9873578 5   userstories_userstory_assigned_users_user_id_6de6e8a7    INDEX     �   CREATE INDEX userstories_userstory_assigned_users_user_id_6de6e8a7 ON public.userstories_userstory_assigned_users USING btree (user_id);
 I   DROP INDEX public.userstories_userstory_assigned_users_user_id_6de6e8a7;
       public            taiga    false    339            �           1259    9873577 :   userstories_userstory_assigned_users_userstory_id_fcb98e26    INDEX     �   CREATE INDEX userstories_userstory_assigned_users_userstory_id_fcb98e26 ON public.userstories_userstory_assigned_users USING btree (userstory_id);
 N   DROP INDEX public.userstories_userstory_assigned_users_userstory_id_fcb98e26;
       public            taiga    false    339            �           1259    9871892 6   userstories_userstory_generated_from_issue_id_afe43198    INDEX     �   CREATE INDEX userstories_userstory_generated_from_issue_id_afe43198 ON public.userstories_userstory USING btree (generated_from_issue_id);
 J   DROP INDEX public.userstories_userstory_generated_from_issue_id_afe43198;
       public            taiga    false    247            �           1259    9873579 5   userstories_userstory_generated_from_task_id_8e958d43    INDEX     �   CREATE INDEX userstories_userstory_generated_from_task_id_8e958d43 ON public.userstories_userstory USING btree (generated_from_task_id);
 I   DROP INDEX public.userstories_userstory_generated_from_task_id_8e958d43;
       public            taiga    false    247            �           1259    9871893 +   userstories_userstory_milestone_id_37f31d22    INDEX     u   CREATE INDEX userstories_userstory_milestone_id_37f31d22 ON public.userstories_userstory USING btree (milestone_id);
 ?   DROP INDEX public.userstories_userstory_milestone_id_37f31d22;
       public            taiga    false    247            �           1259    9871894 '   userstories_userstory_owner_id_df53c64e    INDEX     m   CREATE INDEX userstories_userstory_owner_id_df53c64e ON public.userstories_userstory USING btree (owner_id);
 ;   DROP INDEX public.userstories_userstory_owner_id_df53c64e;
       public            taiga    false    247            �           1259    9871895 )   userstories_userstory_project_id_03e85e9c    INDEX     q   CREATE INDEX userstories_userstory_project_id_03e85e9c ON public.userstories_userstory USING btree (project_id);
 =   DROP INDEX public.userstories_userstory_project_id_03e85e9c;
       public            taiga    false    247            �           1259    9871890 "   userstories_userstory_ref_824701c0    INDEX     c   CREATE INDEX userstories_userstory_ref_824701c0 ON public.userstories_userstory USING btree (ref);
 6   DROP INDEX public.userstories_userstory_ref_824701c0;
       public            taiga    false    247            �           1259    9871896 (   userstories_userstory_status_id_858671dd    INDEX     o   CREATE INDEX userstories_userstory_status_id_858671dd ON public.userstories_userstory USING btree (status_id);
 <   DROP INDEX public.userstories_userstory_status_id_858671dd;
       public            taiga    false    247            �           1259    9873590 *   userstories_userstory_swimlane_id_8ecab79d    INDEX     s   CREATE INDEX userstories_userstory_swimlane_id_8ecab79d ON public.userstories_userstory USING btree (swimlane_id);
 >   DROP INDEX public.userstories_userstory_swimlane_id_8ecab79d;
       public            taiga    false    247            �           1259    9873629 #   votes_vote_content_type_id_c8375fe1    INDEX     e   CREATE INDEX votes_vote_content_type_id_c8375fe1 ON public.votes_vote USING btree (content_type_id);
 7   DROP INDEX public.votes_vote_content_type_id_c8375fe1;
       public            taiga    false    341            �           1259    9873630    votes_vote_user_id_24a74629    INDEX     U   CREATE INDEX votes_vote_user_id_24a74629 ON public.votes_vote USING btree (user_id);
 /   DROP INDEX public.votes_vote_user_id_24a74629;
       public            taiga    false    341            �           1259    9873636 $   votes_votes_content_type_id_29583576    INDEX     g   CREATE INDEX votes_votes_content_type_id_29583576 ON public.votes_votes USING btree (content_type_id);
 8   DROP INDEX public.votes_votes_content_type_id_29583576;
       public            taiga    false    343            �           1259    9873670 $   webhooks_webhook_project_id_76846b5e    INDEX     g   CREATE INDEX webhooks_webhook_project_id_76846b5e ON public.webhooks_webhook USING btree (project_id);
 8   DROP INDEX public.webhooks_webhook_project_id_76846b5e;
       public            taiga    false    345            �           1259    9873676 '   webhooks_webhooklog_webhook_id_646c2008    INDEX     m   CREATE INDEX webhooks_webhooklog_webhook_id_646c2008 ON public.webhooks_webhooklog USING btree (webhook_id);
 ;   DROP INDEX public.webhooks_webhooklog_webhook_id_646c2008;
       public            taiga    false    347            	           1259    9872572    wiki_wikilink_href_46ee8855    INDEX     U   CREATE INDEX wiki_wikilink_href_46ee8855 ON public.wiki_wikilink USING btree (href);
 /   DROP INDEX public.wiki_wikilink_href_46ee8855;
       public            taiga    false    273            
           1259    9872573     wiki_wikilink_href_46ee8855_like    INDEX     n   CREATE INDEX wiki_wikilink_href_46ee8855_like ON public.wiki_wikilink USING btree (href varchar_pattern_ops);
 4   DROP INDEX public.wiki_wikilink_href_46ee8855_like;
       public            taiga    false    273                       1259    9872574 !   wiki_wikilink_project_id_7dc700d7    INDEX     a   CREATE INDEX wiki_wikilink_project_id_7dc700d7 ON public.wiki_wikilink USING btree (project_id);
 5   DROP INDEX public.wiki_wikilink_project_id_7dc700d7;
       public            taiga    false    273                       1259    9872592 '   wiki_wikipage_last_modifier_id_38be071c    INDEX     m   CREATE INDEX wiki_wikipage_last_modifier_id_38be071c ON public.wiki_wikipage USING btree (last_modifier_id);
 ;   DROP INDEX public.wiki_wikipage_last_modifier_id_38be071c;
       public            taiga    false    275                       1259    9872593    wiki_wikipage_owner_id_f1f6c5fd    INDEX     ]   CREATE INDEX wiki_wikipage_owner_id_f1f6c5fd ON public.wiki_wikipage USING btree (owner_id);
 3   DROP INDEX public.wiki_wikipage_owner_id_f1f6c5fd;
       public            taiga    false    275                       1259    9872594 !   wiki_wikipage_project_id_03a1e2ca    INDEX     a   CREATE INDEX wiki_wikipage_project_id_03a1e2ca ON public.wiki_wikipage USING btree (project_id);
 5   DROP INDEX public.wiki_wikipage_project_id_03a1e2ca;
       public            taiga    false    275                       1259    9872590    wiki_wikipage_slug_10d80dc1    INDEX     U   CREATE INDEX wiki_wikipage_slug_10d80dc1 ON public.wiki_wikipage USING btree (slug);
 /   DROP INDEX public.wiki_wikipage_slug_10d80dc1;
       public            taiga    false    275                       1259    9872591     wiki_wikipage_slug_10d80dc1_like    INDEX     n   CREATE INDEX wiki_wikipage_slug_10d80dc1_like ON public.wiki_wikipage USING btree (slug varchar_pattern_ops);
 4   DROP INDEX public.wiki_wikipage_slug_10d80dc1_like;
       public            taiga    false    275            |           1259    9873174 )   workspaces_workspace_name_id_69b27cd8_idx    INDEX     n   CREATE INDEX workspaces_workspace_name_id_69b27cd8_idx ON public.workspaces_workspace USING btree (name, id);
 =   DROP INDEX public.workspaces_workspace_name_id_69b27cd8_idx;
       public            taiga    false    312    312            }           1259    9873173 &   workspaces_workspace_owner_id_d8b120c0    INDEX     k   CREATE INDEX workspaces_workspace_owner_id_d8b120c0 ON public.workspaces_workspace USING btree (owner_id);
 :   DROP INDEX public.workspaces_workspace_owner_id_d8b120c0;
       public            taiga    false    312            �           1259    9873172 '   workspaces_workspace_slug_c37054a2_like    INDEX     |   CREATE INDEX workspaces_workspace_slug_c37054a2_like ON public.workspaces_workspace USING btree (slug varchar_pattern_ops);
 ;   DROP INDEX public.workspaces_workspace_slug_c37054a2_like;
       public            taiga    false    312            �           1259    9873726 /   workspaces_workspacemembership_user_id_091e94f3    INDEX     }   CREATE INDEX workspaces_workspacemembership_user_id_091e94f3 ON public.workspaces_workspacemembership USING btree (user_id);
 C   DROP INDEX public.workspaces_workspacemembership_user_id_091e94f3;
       public            taiga    false    349            �           1259    9873727 4   workspaces_workspacemembership_workspace_id_d634b215    INDEX     �   CREATE INDEX workspaces_workspacemembership_workspace_id_d634b215 ON public.workspaces_workspacemembership USING btree (workspace_id);
 H   DROP INDEX public.workspaces_workspacemembership_workspace_id_d634b215;
       public            taiga    false    349            �           1259    9873728 9   workspaces_workspacemembership_workspace_role_id_39c459bf    INDEX     �   CREATE INDEX workspaces_workspacemembership_workspace_role_id_39c459bf ON public.workspaces_workspacemembership USING btree (workspace_role_id);
 M   DROP INDEX public.workspaces_workspacemembership_workspace_role_id_39c459bf;
       public            taiga    false    349            o           2620    9872872 ^   custom_attributes_epiccustomattribute update_epiccustomvalues_after_remove_epiccustomattribute    TRIGGER       CREATE TRIGGER update_epiccustomvalues_after_remove_epiccustomattribute AFTER DELETE ON public.custom_attributes_epiccustomattribute FOR EACH ROW EXECUTE FUNCTION public.clean_key_in_custom_attributes_values('epic_id', 'epics_epic', 'custom_attributes_epiccustomattributesvalues');
 w   DROP TRIGGER update_epiccustomvalues_after_remove_epiccustomattribute ON public.custom_attributes_epiccustomattribute;
       public          taiga    false    391    294            l           2620    9872841 a   custom_attributes_issuecustomattribute update_issuecustomvalues_after_remove_issuecustomattribute    TRIGGER     !  CREATE TRIGGER update_issuecustomvalues_after_remove_issuecustomattribute AFTER DELETE ON public.custom_attributes_issuecustomattribute FOR EACH ROW EXECUTE FUNCTION public.clean_key_in_custom_attributes_values('issue_id', 'issues_issue', 'custom_attributes_issuecustomattributesvalues');
 z   DROP TRIGGER update_issuecustomvalues_after_remove_issuecustomattribute ON public.custom_attributes_issuecustomattribute;
       public          taiga    false    282    391            k           2620    9872681 4   epics_epic update_project_tags_colors_on_epic_insert    TRIGGER     �   CREATE TRIGGER update_project_tags_colors_on_epic_insert AFTER INSERT ON public.epics_epic FOR EACH ROW EXECUTE FUNCTION public.update_project_tags_colors();
 M   DROP TRIGGER update_project_tags_colors_on_epic_insert ON public.epics_epic;
       public          taiga    false    278    377            j           2620    9872680 4   epics_epic update_project_tags_colors_on_epic_update    TRIGGER     �   CREATE TRIGGER update_project_tags_colors_on_epic_update AFTER UPDATE ON public.epics_epic FOR EACH ROW EXECUTE FUNCTION public.update_project_tags_colors();
 M   DROP TRIGGER update_project_tags_colors_on_epic_update ON public.epics_epic;
       public          taiga    false    377    278            e           2620    9872428 7   issues_issue update_project_tags_colors_on_issue_insert    TRIGGER     �   CREATE TRIGGER update_project_tags_colors_on_issue_insert AFTER INSERT ON public.issues_issue FOR EACH ROW EXECUTE FUNCTION public.update_project_tags_colors();
 P   DROP TRIGGER update_project_tags_colors_on_issue_insert ON public.issues_issue;
       public          taiga    false    377    243            d           2620    9872427 7   issues_issue update_project_tags_colors_on_issue_update    TRIGGER     �   CREATE TRIGGER update_project_tags_colors_on_issue_update AFTER UPDATE ON public.issues_issue FOR EACH ROW EXECUTE FUNCTION public.update_project_tags_colors();
 P   DROP TRIGGER update_project_tags_colors_on_issue_update ON public.issues_issue;
       public          taiga    false    243    377            i           2620    9872426 4   tasks_task update_project_tags_colors_on_task_insert    TRIGGER     �   CREATE TRIGGER update_project_tags_colors_on_task_insert AFTER INSERT ON public.tasks_task FOR EACH ROW EXECUTE FUNCTION public.update_project_tags_colors();
 M   DROP TRIGGER update_project_tags_colors_on_task_insert ON public.tasks_task;
       public          taiga    false    377    259            h           2620    9872425 4   tasks_task update_project_tags_colors_on_task_update    TRIGGER     �   CREATE TRIGGER update_project_tags_colors_on_task_update AFTER UPDATE ON public.tasks_task FOR EACH ROW EXECUTE FUNCTION public.update_project_tags_colors();
 M   DROP TRIGGER update_project_tags_colors_on_task_update ON public.tasks_task;
       public          taiga    false    259    377            g           2620    9872424 D   userstories_userstory update_project_tags_colors_on_userstory_insert    TRIGGER     �   CREATE TRIGGER update_project_tags_colors_on_userstory_insert AFTER INSERT ON public.userstories_userstory FOR EACH ROW EXECUTE FUNCTION public.update_project_tags_colors();
 ]   DROP TRIGGER update_project_tags_colors_on_userstory_insert ON public.userstories_userstory;
       public          taiga    false    377    247            f           2620    9872423 D   userstories_userstory update_project_tags_colors_on_userstory_update    TRIGGER     �   CREATE TRIGGER update_project_tags_colors_on_userstory_update AFTER UPDATE ON public.userstories_userstory FOR EACH ROW EXECUTE FUNCTION public.update_project_tags_colors();
 ]   DROP TRIGGER update_project_tags_colors_on_userstory_update ON public.userstories_userstory;
       public          taiga    false    247    377            m           2620    9872840 ^   custom_attributes_taskcustomattribute update_taskcustomvalues_after_remove_taskcustomattribute    TRIGGER       CREATE TRIGGER update_taskcustomvalues_after_remove_taskcustomattribute AFTER DELETE ON public.custom_attributes_taskcustomattribute FOR EACH ROW EXECUTE FUNCTION public.clean_key_in_custom_attributes_values('task_id', 'tasks_task', 'custom_attributes_taskcustomattributesvalues');
 w   DROP TRIGGER update_taskcustomvalues_after_remove_taskcustomattribute ON public.custom_attributes_taskcustomattribute;
       public          taiga    false    391    284            n           2620    9872839 j   custom_attributes_userstorycustomattribute update_userstorycustomvalues_after_remove_userstorycustomattrib    TRIGGER     <  CREATE TRIGGER update_userstorycustomvalues_after_remove_userstorycustomattrib AFTER DELETE ON public.custom_attributes_userstorycustomattribute FOR EACH ROW EXECUTE FUNCTION public.clean_key_in_custom_attributes_values('user_story_id', 'userstories_userstory', 'custom_attributes_userstorycustomattributesvalues');
 �   DROP TRIGGER update_userstorycustomvalues_after_remove_userstorycustomattrib ON public.custom_attributes_userstorycustomattribute;
       public          taiga    false    286    391            �           2606    9871590 Q   attachments_attachment attachments_attachme_content_type_id_35dd9d5d_fk_django_co    FK CONSTRAINT     �   ALTER TABLE ONLY public.attachments_attachment
    ADD CONSTRAINT attachments_attachme_content_type_id_35dd9d5d_fk_django_co FOREIGN KEY (content_type_id) REFERENCES public.django_content_type(id) DEFERRABLE INITIALLY DEFERRED;
 {   ALTER TABLE ONLY public.attachments_attachment DROP CONSTRAINT attachments_attachme_content_type_id_35dd9d5d_fk_django_co;
       public          taiga    false    233    4085    205            �           2606    9871600 L   attachments_attachment attachments_attachme_project_id_50714f52_fk_projects_    FK CONSTRAINT     �   ALTER TABLE ONLY public.attachments_attachment
    ADD CONSTRAINT attachments_attachme_project_id_50714f52_fk_projects_ FOREIGN KEY (project_id) REFERENCES public.projects_project(id) DEFERRABLE INITIALLY DEFERRED;
 v   ALTER TABLE ONLY public.attachments_attachment DROP CONSTRAINT attachments_attachme_project_id_50714f52_fk_projects_;
       public          taiga    false    4144    215    233            �           2606    9871609 P   attachments_attachment attachments_attachment_owner_id_720defb8_fk_users_user_id    FK CONSTRAINT     �   ALTER TABLE ONLY public.attachments_attachment
    ADD CONSTRAINT attachments_attachment_owner_id_720defb8_fk_users_user_id FOREIGN KEY (owner_id) REFERENCES public.users_user(id) DEFERRABLE INITIALLY DEFERRED;
 z   ALTER TABLE ONLY public.attachments_attachment DROP CONSTRAINT attachments_attachment_owner_id_720defb8_fk_users_user_id;
       public          taiga    false    4090    233    207                       2606    9871657 O   auth_group_permissions auth_group_permissio_permission_id_84c5c92e_fk_auth_perm    FK CONSTRAINT     �   ALTER TABLE ONLY public.auth_group_permissions
    ADD CONSTRAINT auth_group_permissio_permission_id_84c5c92e_fk_auth_perm FOREIGN KEY (permission_id) REFERENCES public.auth_permission(id) DEFERRABLE INITIALLY DEFERRED;
 y   ALTER TABLE ONLY public.auth_group_permissions DROP CONSTRAINT auth_group_permissio_permission_id_84c5c92e_fk_auth_perm;
       public          taiga    false    4225    235    239                       2606    9871652 P   auth_group_permissions auth_group_permissions_group_id_b120cbf9_fk_auth_group_id    FK CONSTRAINT     �   ALTER TABLE ONLY public.auth_group_permissions
    ADD CONSTRAINT auth_group_permissions_group_id_b120cbf9_fk_auth_group_id FOREIGN KEY (group_id) REFERENCES public.auth_group(id) DEFERRABLE INITIALLY DEFERRED;
 z   ALTER TABLE ONLY public.auth_group_permissions DROP CONSTRAINT auth_group_permissions_group_id_b120cbf9_fk_auth_group_id;
       public          taiga    false    239    4230    237                        2606    9871643 E   auth_permission auth_permission_content_type_id_2f476e4b_fk_django_co    FK CONSTRAINT     �   ALTER TABLE ONLY public.auth_permission
    ADD CONSTRAINT auth_permission_content_type_id_2f476e4b_fk_django_co FOREIGN KEY (content_type_id) REFERENCES public.django_content_type(id) DEFERRABLE INITIALLY DEFERRED;
 o   ALTER TABLE ONLY public.auth_permission DROP CONSTRAINT auth_permission_content_type_id_2f476e4b_fk_django_co;
       public          taiga    false    235    205    4085            1           2606    9872520 T   contact_contactentry contact_contactentry_project_id_27bfec4e_fk_projects_project_id    FK CONSTRAINT     �   ALTER TABLE ONLY public.contact_contactentry
    ADD CONSTRAINT contact_contactentry_project_id_27bfec4e_fk_projects_project_id FOREIGN KEY (project_id) REFERENCES public.projects_project(id) DEFERRABLE INITIALLY DEFERRED;
 ~   ALTER TABLE ONLY public.contact_contactentry DROP CONSTRAINT contact_contactentry_project_id_27bfec4e_fk_projects_project_id;
       public          taiga    false    271    215    4144            2           2606    9872525 K   contact_contactentry contact_contactentry_user_id_f1f19c5f_fk_users_user_id    FK CONSTRAINT     �   ALTER TABLE ONLY public.contact_contactentry
    ADD CONSTRAINT contact_contactentry_user_id_f1f19c5f_fk_users_user_id FOREIGN KEY (user_id) REFERENCES public.users_user(id) DEFERRABLE INITIALLY DEFERRED;
 u   ALTER TABLE ONLY public.contact_contactentry DROP CONSTRAINT contact_contactentry_user_id_f1f19c5f_fk_users_user_id;
       public          taiga    false    271    4090    207            E           2606    9872879 _   custom_attributes_epiccustomattributesvalues custom_attributes_ep_epic_id_d413e57a_fk_epics_epi    FK CONSTRAINT     �   ALTER TABLE ONLY public.custom_attributes_epiccustomattributesvalues
    ADD CONSTRAINT custom_attributes_ep_epic_id_d413e57a_fk_epics_epi FOREIGN KEY (epic_id) REFERENCES public.epics_epic(id) DEFERRABLE INITIALLY DEFERRED;
 �   ALTER TABLE ONLY public.custom_attributes_epiccustomattributesvalues DROP CONSTRAINT custom_attributes_ep_epic_id_d413e57a_fk_epics_epi;
       public          taiga    false    278    296    4386            D           2606    9872873 [   custom_attributes_epiccustomattribute custom_attributes_ep_project_id_ad2cfaa8_fk_projects_    FK CONSTRAINT     �   ALTER TABLE ONLY public.custom_attributes_epiccustomattribute
    ADD CONSTRAINT custom_attributes_ep_project_id_ad2cfaa8_fk_projects_ FOREIGN KEY (project_id) REFERENCES public.projects_project(id) DEFERRABLE INITIALLY DEFERRED;
 �   ALTER TABLE ONLY public.custom_attributes_epiccustomattribute DROP CONSTRAINT custom_attributes_ep_project_id_ad2cfaa8_fk_projects_;
       public          taiga    false    294    215    4144            A           2606    9872816 a   custom_attributes_issuecustomattributesvalues custom_attributes_is_issue_id_868161f8_fk_issues_is    FK CONSTRAINT     �   ALTER TABLE ONLY public.custom_attributes_issuecustomattributesvalues
    ADD CONSTRAINT custom_attributes_is_issue_id_868161f8_fk_issues_is FOREIGN KEY (issue_id) REFERENCES public.issues_issue(id) DEFERRABLE INITIALLY DEFERRED;
 �   ALTER TABLE ONLY public.custom_attributes_issuecustomattributesvalues DROP CONSTRAINT custom_attributes_is_issue_id_868161f8_fk_issues_is;
       public          taiga    false    243    4253    288            >           2606    9872759 \   custom_attributes_issuecustomattribute custom_attributes_is_project_id_3b4acff5_fk_projects_    FK CONSTRAINT     �   ALTER TABLE ONLY public.custom_attributes_issuecustomattribute
    ADD CONSTRAINT custom_attributes_is_project_id_3b4acff5_fk_projects_ FOREIGN KEY (project_id) REFERENCES public.projects_project(id) DEFERRABLE INITIALLY DEFERRED;
 �   ALTER TABLE ONLY public.custom_attributes_issuecustomattribute DROP CONSTRAINT custom_attributes_is_project_id_3b4acff5_fk_projects_;
       public          taiga    false    4144    282    215            ?           2606    9872765 [   custom_attributes_taskcustomattribute custom_attributes_ta_project_id_f0f622a8_fk_projects_    FK CONSTRAINT     �   ALTER TABLE ONLY public.custom_attributes_taskcustomattribute
    ADD CONSTRAINT custom_attributes_ta_project_id_f0f622a8_fk_projects_ FOREIGN KEY (project_id) REFERENCES public.projects_project(id) DEFERRABLE INITIALLY DEFERRED;
 �   ALTER TABLE ONLY public.custom_attributes_taskcustomattribute DROP CONSTRAINT custom_attributes_ta_project_id_f0f622a8_fk_projects_;
       public          taiga    false    284    4144    215            B           2606    9872821 _   custom_attributes_taskcustomattributesvalues custom_attributes_ta_task_id_3d1ccf5e_fk_tasks_tas    FK CONSTRAINT     �   ALTER TABLE ONLY public.custom_attributes_taskcustomattributesvalues
    ADD CONSTRAINT custom_attributes_ta_task_id_3d1ccf5e_fk_tasks_tas FOREIGN KEY (task_id) REFERENCES public.tasks_task(id) DEFERRABLE INITIALLY DEFERRED;
 �   ALTER TABLE ONLY public.custom_attributes_taskcustomattributesvalues DROP CONSTRAINT custom_attributes_ta_task_id_3d1ccf5e_fk_tasks_tas;
       public          taiga    false    259    4314    290            @           2606    9872771 `   custom_attributes_userstorycustomattribute custom_attributes_us_project_id_2619cf6c_fk_projects_    FK CONSTRAINT     �   ALTER TABLE ONLY public.custom_attributes_userstorycustomattribute
    ADD CONSTRAINT custom_attributes_us_project_id_2619cf6c_fk_projects_ FOREIGN KEY (project_id) REFERENCES public.projects_project(id) DEFERRABLE INITIALLY DEFERRED;
 �   ALTER TABLE ONLY public.custom_attributes_userstorycustomattribute DROP CONSTRAINT custom_attributes_us_project_id_2619cf6c_fk_projects_;
       public          taiga    false    4144    286    215            C           2606    9872826 j   custom_attributes_userstorycustomattributesvalues custom_attributes_us_user_story_id_99b10c43_fk_userstori    FK CONSTRAINT     �   ALTER TABLE ONLY public.custom_attributes_userstorycustomattributesvalues
    ADD CONSTRAINT custom_attributes_us_user_story_id_99b10c43_fk_userstori FOREIGN KEY (user_story_id) REFERENCES public.userstories_userstory(id) DEFERRABLE INITIALLY DEFERRED;
 �   ALTER TABLE ONLY public.custom_attributes_userstorycustomattributesvalues DROP CONSTRAINT custom_attributes_us_user_story_id_99b10c43_fk_userstori;
       public          taiga    false    4273    292    247            �           2606    9871319 G   django_admin_log django_admin_log_content_type_id_c4bce8eb_fk_django_co    FK CONSTRAINT     �   ALTER TABLE ONLY public.django_admin_log
    ADD CONSTRAINT django_admin_log_content_type_id_c4bce8eb_fk_django_co FOREIGN KEY (content_type_id) REFERENCES public.django_content_type(id) DEFERRABLE INITIALLY DEFERRED;
 q   ALTER TABLE ONLY public.django_admin_log DROP CONSTRAINT django_admin_log_content_type_id_c4bce8eb_fk_django_co;
       public          taiga    false    205    4085    209            �           2606    9871324 C   django_admin_log django_admin_log_user_id_c564eba6_fk_users_user_id    FK CONSTRAINT     �   ALTER TABLE ONLY public.django_admin_log
    ADD CONSTRAINT django_admin_log_user_id_c564eba6_fk_users_user_id FOREIGN KEY (user_id) REFERENCES public.users_user(id) DEFERRABLE INITIALLY DEFERRED;
 m   ALTER TABLE ONLY public.django_admin_log DROP CONSTRAINT django_admin_log_user_id_c564eba6_fk_users_user_id;
       public          taiga    false    4090    209    207            F           2606    9872990 N   easy_thumbnails_thumbnail easy_thumbnails_thum_source_id_5b57bc77_fk_easy_thum    FK CONSTRAINT     �   ALTER TABLE ONLY public.easy_thumbnails_thumbnail
    ADD CONSTRAINT easy_thumbnails_thum_source_id_5b57bc77_fk_easy_thum FOREIGN KEY (source_id) REFERENCES public.easy_thumbnails_source(id) DEFERRABLE INITIALLY DEFERRED;
 x   ALTER TABLE ONLY public.easy_thumbnails_thumbnail DROP CONSTRAINT easy_thumbnails_thum_source_id_5b57bc77_fk_easy_thum;
       public          taiga    false    301    4442    299            G           2606    9873012 [   easy_thumbnails_thumbnaildimensions easy_thumbnails_thum_thumbnail_id_c3a0c549_fk_easy_thum    FK CONSTRAINT     �   ALTER TABLE ONLY public.easy_thumbnails_thumbnaildimensions
    ADD CONSTRAINT easy_thumbnails_thum_thumbnail_id_c3a0c549_fk_easy_thum FOREIGN KEY (thumbnail_id) REFERENCES public.easy_thumbnails_thumbnail(id) DEFERRABLE INITIALLY DEFERRED;
 �   ALTER TABLE ONLY public.easy_thumbnails_thumbnaildimensions DROP CONSTRAINT easy_thumbnails_thum_thumbnail_id_c3a0c549_fk_easy_thum;
       public          taiga    false    303    301    4452            ;           2606    9873038 >   epics_epic epics_epic_assigned_to_id_13e08004_fk_users_user_id    FK CONSTRAINT     �   ALTER TABLE ONLY public.epics_epic
    ADD CONSTRAINT epics_epic_assigned_to_id_13e08004_fk_users_user_id FOREIGN KEY (assigned_to_id) REFERENCES public.users_user(id) DEFERRABLE INITIALLY DEFERRED;
 h   ALTER TABLE ONLY public.epics_epic DROP CONSTRAINT epics_epic_assigned_to_id_13e08004_fk_users_user_id;
       public          taiga    false    4090    207    278            8           2606    9872687 8   epics_epic epics_epic_owner_id_b09888c4_fk_users_user_id    FK CONSTRAINT     �   ALTER TABLE ONLY public.epics_epic
    ADD CONSTRAINT epics_epic_owner_id_b09888c4_fk_users_user_id FOREIGN KEY (owner_id) REFERENCES public.users_user(id) DEFERRABLE INITIALLY DEFERRED;
 b   ALTER TABLE ONLY public.epics_epic DROP CONSTRAINT epics_epic_owner_id_b09888c4_fk_users_user_id;
       public          taiga    false    278    207    4090            9           2606    9872692 @   epics_epic epics_epic_project_id_d98aaef7_fk_projects_project_id    FK CONSTRAINT     �   ALTER TABLE ONLY public.epics_epic
    ADD CONSTRAINT epics_epic_project_id_d98aaef7_fk_projects_project_id FOREIGN KEY (project_id) REFERENCES public.projects_project(id) DEFERRABLE INITIALLY DEFERRED;
 j   ALTER TABLE ONLY public.epics_epic DROP CONSTRAINT epics_epic_project_id_d98aaef7_fk_projects_project_id;
       public          taiga    false    278    215    4144            :           2606    9872697 B   epics_epic epics_epic_status_id_4cf3af1a_fk_projects_epicstatus_id    FK CONSTRAINT     �   ALTER TABLE ONLY public.epics_epic
    ADD CONSTRAINT epics_epic_status_id_4cf3af1a_fk_projects_epicstatus_id FOREIGN KEY (status_id) REFERENCES public.projects_epicstatus(id) DEFERRABLE INITIALLY DEFERRED;
 l   ALTER TABLE ONLY public.epics_epic DROP CONSTRAINT epics_epic_status_id_4cf3af1a_fk_projects_epicstatus_id;
       public          taiga    false    278    269    4349            =           2606    9872712 O   epics_relateduserstory epics_relatedusersto_user_story_id_329a951c_fk_userstori    FK CONSTRAINT     �   ALTER TABLE ONLY public.epics_relateduserstory
    ADD CONSTRAINT epics_relatedusersto_user_story_id_329a951c_fk_userstori FOREIGN KEY (user_story_id) REFERENCES public.userstories_userstory(id) DEFERRABLE INITIALLY DEFERRED;
 y   ALTER TABLE ONLY public.epics_relateduserstory DROP CONSTRAINT epics_relatedusersto_user_story_id_329a951c_fk_userstori;
       public          taiga    false    4273    247    280            <           2606    9872707 O   epics_relateduserstory epics_relateduserstory_epic_id_57605230_fk_epics_epic_id    FK CONSTRAINT     �   ALTER TABLE ONLY public.epics_relateduserstory
    ADD CONSTRAINT epics_relateduserstory_epic_id_57605230_fk_epics_epic_id FOREIGN KEY (epic_id) REFERENCES public.epics_epic(id) DEFERRABLE INITIALLY DEFERRED;
 y   ALTER TABLE ONLY public.epics_relateduserstory DROP CONSTRAINT epics_relateduserstory_epic_id_57605230_fk_epics_epic_id;
       public          taiga    false    280    278    4386            H           2606    9873065 X   external_apps_applicationtoken external_apps_applic_application_id_0e934655_fk_external_    FK CONSTRAINT     �   ALTER TABLE ONLY public.external_apps_applicationtoken
    ADD CONSTRAINT external_apps_applic_application_id_0e934655_fk_external_ FOREIGN KEY (application_id) REFERENCES public.external_apps_application(id) DEFERRABLE INITIALLY DEFERRED;
 �   ALTER TABLE ONLY public.external_apps_applicationtoken DROP CONSTRAINT external_apps_applic_application_id_0e934655_fk_external_;
       public          taiga    false    4462    306    304            I           2606    9873070 Q   external_apps_applicationtoken external_apps_applic_user_id_6e2f1e8a_fk_users_use    FK CONSTRAINT     �   ALTER TABLE ONLY public.external_apps_applicationtoken
    ADD CONSTRAINT external_apps_applic_user_id_6e2f1e8a_fk_users_use FOREIGN KEY (user_id) REFERENCES public.users_user(id) DEFERRABLE INITIALLY DEFERRED;
 {   ALTER TABLE ONLY public.external_apps_applicationtoken DROP CONSTRAINT external_apps_applic_user_id_6e2f1e8a_fk_users_use;
       public          taiga    false    4090    207    306            7           2606    9872656 T   history_historyentry history_historyentry_project_id_9b008f70_fk_projects_project_id    FK CONSTRAINT     �   ALTER TABLE ONLY public.history_historyentry
    ADD CONSTRAINT history_historyentry_project_id_9b008f70_fk_projects_project_id FOREIGN KEY (project_id) REFERENCES public.projects_project(id) DEFERRABLE INITIALLY DEFERRED;
 ~   ALTER TABLE ONLY public.history_historyentry DROP CONSTRAINT history_historyentry_project_id_9b008f70_fk_projects_project_id;
       public          taiga    false    215    276    4144                       2606    9871755 B   issues_issue issues_issue_assigned_to_id_c6054289_fk_users_user_id    FK CONSTRAINT     �   ALTER TABLE ONLY public.issues_issue
    ADD CONSTRAINT issues_issue_assigned_to_id_c6054289_fk_users_user_id FOREIGN KEY (assigned_to_id) REFERENCES public.users_user(id) DEFERRABLE INITIALLY DEFERRED;
 l   ALTER TABLE ONLY public.issues_issue DROP CONSTRAINT issues_issue_assigned_to_id_c6054289_fk_users_user_id;
       public          taiga    false    4090    207    243                       2606    9871760 J   issues_issue issues_issue_milestone_id_3c2695ee_fk_milestones_milestone_id    FK CONSTRAINT     �   ALTER TABLE ONLY public.issues_issue
    ADD CONSTRAINT issues_issue_milestone_id_3c2695ee_fk_milestones_milestone_id FOREIGN KEY (milestone_id) REFERENCES public.milestones_milestone(id) DEFERRABLE INITIALLY DEFERRED;
 t   ALTER TABLE ONLY public.issues_issue DROP CONSTRAINT issues_issue_milestone_id_3c2695ee_fk_milestones_milestone_id;
       public          taiga    false    4243    243    241                       2606    9871765 <   issues_issue issues_issue_owner_id_5c361b47_fk_users_user_id    FK CONSTRAINT     �   ALTER TABLE ONLY public.issues_issue
    ADD CONSTRAINT issues_issue_owner_id_5c361b47_fk_users_user_id FOREIGN KEY (owner_id) REFERENCES public.users_user(id) DEFERRABLE INITIALLY DEFERRED;
 f   ALTER TABLE ONLY public.issues_issue DROP CONSTRAINT issues_issue_owner_id_5c361b47_fk_users_user_id;
       public          taiga    false    207    4090    243            	           2606    9872399 F   issues_issue issues_issue_priority_id_93842a93_fk_projects_priority_id    FK CONSTRAINT     �   ALTER TABLE ONLY public.issues_issue
    ADD CONSTRAINT issues_issue_priority_id_93842a93_fk_projects_priority_id FOREIGN KEY (priority_id) REFERENCES public.projects_priority(id) DEFERRABLE INITIALLY DEFERRED;
 p   ALTER TABLE ONLY public.issues_issue DROP CONSTRAINT issues_issue_priority_id_93842a93_fk_projects_priority_id;
       public          taiga    false    4183    243    223                       2606    9871775 D   issues_issue issues_issue_project_id_4b0f3e2f_fk_projects_project_id    FK CONSTRAINT     �   ALTER TABLE ONLY public.issues_issue
    ADD CONSTRAINT issues_issue_project_id_4b0f3e2f_fk_projects_project_id FOREIGN KEY (project_id) REFERENCES public.projects_project(id) DEFERRABLE INITIALLY DEFERRED;
 n   ALTER TABLE ONLY public.issues_issue DROP CONSTRAINT issues_issue_project_id_4b0f3e2f_fk_projects_project_id;
       public          taiga    false    4144    243    215            
           2606    9873101 F   issues_issue issues_issue_severity_id_695dade0_fk_projects_severity_id    FK CONSTRAINT     �   ALTER TABLE ONLY public.issues_issue
    ADD CONSTRAINT issues_issue_severity_id_695dade0_fk_projects_severity_id FOREIGN KEY (severity_id) REFERENCES public.projects_severity(id) DEFERRABLE INITIALLY DEFERRED;
 p   ALTER TABLE ONLY public.issues_issue DROP CONSTRAINT issues_issue_severity_id_695dade0_fk_projects_severity_id;
       public          taiga    false    4193    227    243                       2606    9873106 G   issues_issue issues_issue_status_id_64473cf1_fk_projects_issuestatus_id    FK CONSTRAINT     �   ALTER TABLE ONLY public.issues_issue
    ADD CONSTRAINT issues_issue_status_id_64473cf1_fk_projects_issuestatus_id FOREIGN KEY (status_id) REFERENCES public.projects_issuestatus(id) DEFERRABLE INITIALLY DEFERRED;
 q   ALTER TABLE ONLY public.issues_issue DROP CONSTRAINT issues_issue_status_id_64473cf1_fk_projects_issuestatus_id;
       public          taiga    false    243    217    4164                       2606    9873111 C   issues_issue issues_issue_type_id_c1063362_fk_projects_issuetype_id    FK CONSTRAINT     �   ALTER TABLE ONLY public.issues_issue
    ADD CONSTRAINT issues_issue_type_id_c1063362_fk_projects_issuetype_id FOREIGN KEY (type_id) REFERENCES public.projects_issuetype(id) DEFERRABLE INITIALLY DEFERRED;
 m   ALTER TABLE ONLY public.issues_issue DROP CONSTRAINT issues_issue_type_id_c1063362_fk_projects_issuetype_id;
       public          taiga    false    243    219    4173            .           2606    9872346 H   likes_like likes_like_content_type_id_8ffc2116_fk_django_content_type_id    FK CONSTRAINT     �   ALTER TABLE ONLY public.likes_like
    ADD CONSTRAINT likes_like_content_type_id_8ffc2116_fk_django_content_type_id FOREIGN KEY (content_type_id) REFERENCES public.django_content_type(id) DEFERRABLE INITIALLY DEFERRED;
 r   ALTER TABLE ONLY public.likes_like DROP CONSTRAINT likes_like_content_type_id_8ffc2116_fk_django_content_type_id;
       public          taiga    false    4085    205    267            /           2606    9872351 7   likes_like likes_like_user_id_aae4c421_fk_users_user_id    FK CONSTRAINT     �   ALTER TABLE ONLY public.likes_like
    ADD CONSTRAINT likes_like_user_id_aae4c421_fk_users_user_id FOREIGN KEY (user_id) REFERENCES public.users_user(id) DEFERRABLE INITIALLY DEFERRED;
 a   ALTER TABLE ONLY public.likes_like DROP CONSTRAINT likes_like_user_id_aae4c421_fk_users_user_id;
       public          taiga    false    207    4090    267                       2606    9871706 L   milestones_milestone milestones_milestone_owner_id_216ba23b_fk_users_user_id    FK CONSTRAINT     �   ALTER TABLE ONLY public.milestones_milestone
    ADD CONSTRAINT milestones_milestone_owner_id_216ba23b_fk_users_user_id FOREIGN KEY (owner_id) REFERENCES public.users_user(id) DEFERRABLE INITIALLY DEFERRED;
 v   ALTER TABLE ONLY public.milestones_milestone DROP CONSTRAINT milestones_milestone_owner_id_216ba23b_fk_users_user_id;
       public          taiga    false    207    241    4090                       2606    9871711 T   milestones_milestone milestones_milestone_project_id_6151cb75_fk_projects_project_id    FK CONSTRAINT     �   ALTER TABLE ONLY public.milestones_milestone
    ADD CONSTRAINT milestones_milestone_project_id_6151cb75_fk_projects_project_id FOREIGN KEY (project_id) REFERENCES public.projects_project(id) DEFERRABLE INITIALLY DEFERRED;
 ~   ALTER TABLE ONLY public.milestones_milestone DROP CONSTRAINT milestones_milestone_project_id_6151cb75_fk_projects_project_id;
       public          taiga    false    215    241    4144                       2606    9873121 w   notifications_historychangenotification_history_entries notifications_histor_historychangenotific_65e52ffd_fk_notificat    FK CONSTRAINT     +  ALTER TABLE ONLY public.notifications_historychangenotification_history_entries
    ADD CONSTRAINT notifications_histor_historychangenotific_65e52ffd_fk_notificat FOREIGN KEY (historychangenotification_id) REFERENCES public.notifications_historychangenotification(id) DEFERRABLE INITIALLY DEFERRED;
 �   ALTER TABLE ONLY public.notifications_historychangenotification_history_entries DROP CONSTRAINT notifications_histor_historychangenotific_65e52ffd_fk_notificat;
       public          taiga    false    251    253    4288                       2606    9873131 t   notifications_historychangenotification_notify_users notifications_histor_historychangenotific_d8e98e97_fk_notificat    FK CONSTRAINT     (  ALTER TABLE ONLY public.notifications_historychangenotification_notify_users
    ADD CONSTRAINT notifications_histor_historychangenotific_d8e98e97_fk_notificat FOREIGN KEY (historychangenotification_id) REFERENCES public.notifications_historychangenotification(id) DEFERRABLE INITIALLY DEFERRED;
 �   ALTER TABLE ONLY public.notifications_historychangenotification_notify_users DROP CONSTRAINT notifications_histor_historychangenotific_d8e98e97_fk_notificat;
       public          taiga    false    255    4288    251                       2606    9873116 r   notifications_historychangenotification_history_entries notifications_histor_historyentry_id_ad550852_fk_history_h    FK CONSTRAINT       ALTER TABLE ONLY public.notifications_historychangenotification_history_entries
    ADD CONSTRAINT notifications_histor_historyentry_id_ad550852_fk_history_h FOREIGN KEY (historyentry_id) REFERENCES public.history_historyentry(id) DEFERRABLE INITIALLY DEFERRED;
 �   ALTER TABLE ONLY public.notifications_historychangenotification_history_entries DROP CONSTRAINT notifications_histor_historyentry_id_ad550852_fk_history_h;
       public          taiga    false    4381    276    253                       2606    9872020 [   notifications_historychangenotification notifications_histor_owner_id_6f63be8a_fk_users_use    FK CONSTRAINT     �   ALTER TABLE ONLY public.notifications_historychangenotification
    ADD CONSTRAINT notifications_histor_owner_id_6f63be8a_fk_users_use FOREIGN KEY (owner_id) REFERENCES public.users_user(id) DEFERRABLE INITIALLY DEFERRED;
 �   ALTER TABLE ONLY public.notifications_historychangenotification DROP CONSTRAINT notifications_histor_owner_id_6f63be8a_fk_users_use;
       public          taiga    false    4090    207    251                       2606    9872025 ]   notifications_historychangenotification notifications_histor_project_id_52cf5e2b_fk_projects_    FK CONSTRAINT     �   ALTER TABLE ONLY public.notifications_historychangenotification
    ADD CONSTRAINT notifications_histor_project_id_52cf5e2b_fk_projects_ FOREIGN KEY (project_id) REFERENCES public.projects_project(id) DEFERRABLE INITIALLY DEFERRED;
 �   ALTER TABLE ONLY public.notifications_historychangenotification DROP CONSTRAINT notifications_histor_project_id_52cf5e2b_fk_projects_;
       public          taiga    false    251    215    4144                       2606    9873126 g   notifications_historychangenotification_notify_users notifications_histor_user_id_f7bd2448_fk_users_use    FK CONSTRAINT     �   ALTER TABLE ONLY public.notifications_historychangenotification_notify_users
    ADD CONSTRAINT notifications_histor_user_id_f7bd2448_fk_users_use FOREIGN KEY (user_id) REFERENCES public.users_user(id) DEFERRABLE INITIALLY DEFERRED;
 �   ALTER TABLE ONLY public.notifications_historychangenotification_notify_users DROP CONSTRAINT notifications_histor_user_id_f7bd2448_fk_users_use;
       public          taiga    false    4090    255    207                       2606    9871963 P   notifications_notifypolicy notifications_notify_project_id_aa5da43f_fk_projects_    FK CONSTRAINT     �   ALTER TABLE ONLY public.notifications_notifypolicy
    ADD CONSTRAINT notifications_notify_project_id_aa5da43f_fk_projects_ FOREIGN KEY (project_id) REFERENCES public.projects_project(id) DEFERRABLE INITIALLY DEFERRED;
 z   ALTER TABLE ONLY public.notifications_notifypolicy DROP CONSTRAINT notifications_notify_project_id_aa5da43f_fk_projects_;
       public          taiga    false    249    215    4144                       2606    9871968 W   notifications_notifypolicy notifications_notifypolicy_user_id_2902cbeb_fk_users_user_id    FK CONSTRAINT     �   ALTER TABLE ONLY public.notifications_notifypolicy
    ADD CONSTRAINT notifications_notifypolicy_user_id_2902cbeb_fk_users_user_id FOREIGN KEY (user_id) REFERENCES public.users_user(id) DEFERRABLE INITIALLY DEFERRED;
 �   ALTER TABLE ONLY public.notifications_notifypolicy DROP CONSTRAINT notifications_notifypolicy_user_id_2902cbeb_fk_users_user_id;
       public          taiga    false    207    249    4090                        2606    9872074 P   notifications_watched notifications_watche_content_type_id_7b3ab729_fk_django_co    FK CONSTRAINT     �   ALTER TABLE ONLY public.notifications_watched
    ADD CONSTRAINT notifications_watche_content_type_id_7b3ab729_fk_django_co FOREIGN KEY (content_type_id) REFERENCES public.django_content_type(id) DEFERRABLE INITIALLY DEFERRED;
 z   ALTER TABLE ONLY public.notifications_watched DROP CONSTRAINT notifications_watche_content_type_id_7b3ab729_fk_django_co;
       public          taiga    false    205    257    4085            "           2606    9872084 K   notifications_watched notifications_watche_project_id_c88baa46_fk_projects_    FK CONSTRAINT     �   ALTER TABLE ONLY public.notifications_watched
    ADD CONSTRAINT notifications_watche_project_id_c88baa46_fk_projects_ FOREIGN KEY (project_id) REFERENCES public.projects_project(id) DEFERRABLE INITIALLY DEFERRED;
 u   ALTER TABLE ONLY public.notifications_watched DROP CONSTRAINT notifications_watche_project_id_c88baa46_fk_projects_;
       public          taiga    false    257    215    4144            !           2606    9872079 M   notifications_watched notifications_watched_user_id_1bce1955_fk_users_user_id    FK CONSTRAINT     �   ALTER TABLE ONLY public.notifications_watched
    ADD CONSTRAINT notifications_watched_user_id_1bce1955_fk_users_user_id FOREIGN KEY (user_id) REFERENCES public.users_user(id) DEFERRABLE INITIALLY DEFERRED;
 w   ALTER TABLE ONLY public.notifications_watched DROP CONSTRAINT notifications_watched_user_id_1bce1955_fk_users_user_id;
       public          taiga    false    257    4090    207            J           2606    9873150 ]   notifications_webnotification notifications_webnotification_user_id_f32287d5_fk_users_user_id    FK CONSTRAINT     �   ALTER TABLE ONLY public.notifications_webnotification
    ADD CONSTRAINT notifications_webnotification_user_id_f32287d5_fk_users_user_id FOREIGN KEY (user_id) REFERENCES public.users_user(id) DEFERRABLE INITIALLY DEFERRED;
 �   ALTER TABLE ONLY public.notifications_webnotification DROP CONSTRAINT notifications_webnotification_user_id_f32287d5_fk_users_user_id;
       public          taiga    false    207    4090    310            0           2606    9872452 R   projects_epicstatus projects_epicstatus_project_id_d2c43c29_fk_projects_project_id    FK CONSTRAINT     �   ALTER TABLE ONLY public.projects_epicstatus
    ADD CONSTRAINT projects_epicstatus_project_id_d2c43c29_fk_projects_project_id FOREIGN KEY (project_id) REFERENCES public.projects_project(id) DEFERRABLE INITIALLY DEFERRED;
 |   ALTER TABLE ONLY public.projects_epicstatus DROP CONSTRAINT projects_epicstatus_project_id_d2c43c29_fk_projects_project_id;
       public          taiga    false    269    215    4144            L           2606    9873210 K   projects_issueduedate projects_issueduedat_project_id_ec077eb7_fk_projects_    FK CONSTRAINT     �   ALTER TABLE ONLY public.projects_issueduedate
    ADD CONSTRAINT projects_issueduedat_project_id_ec077eb7_fk_projects_ FOREIGN KEY (project_id) REFERENCES public.projects_project(id) DEFERRABLE INITIALLY DEFERRED;
 u   ALTER TABLE ONLY public.projects_issueduedate DROP CONSTRAINT projects_issueduedat_project_id_ec077eb7_fk_projects_;
       public          taiga    false    215    314    4144            �           2606    9871494 T   projects_issuestatus projects_issuestatus_project_id_1988ebf4_fk_projects_project_id    FK CONSTRAINT     �   ALTER TABLE ONLY public.projects_issuestatus
    ADD CONSTRAINT projects_issuestatus_project_id_1988ebf4_fk_projects_project_id FOREIGN KEY (project_id) REFERENCES public.projects_project(id) DEFERRABLE INITIALLY DEFERRED;
 ~   ALTER TABLE ONLY public.projects_issuestatus DROP CONSTRAINT projects_issuestatus_project_id_1988ebf4_fk_projects_project_id;
       public          taiga    false    217    4144    215            �           2606    9871500 P   projects_issuetype projects_issuetype_project_id_e831e4ae_fk_projects_project_id    FK CONSTRAINT     �   ALTER TABLE ONLY public.projects_issuetype
    ADD CONSTRAINT projects_issuetype_project_id_e831e4ae_fk_projects_project_id FOREIGN KEY (project_id) REFERENCES public.projects_project(id) DEFERRABLE INITIALLY DEFERRED;
 z   ALTER TABLE ONLY public.projects_issuetype DROP CONSTRAINT projects_issuetype_project_id_e831e4ae_fk_projects_project_id;
       public          taiga    false    219    4144    215            �           2606    9871945 O   projects_membership projects_membership_invited_by_id_a2c6c913_fk_users_user_id    FK CONSTRAINT     �   ALTER TABLE ONLY public.projects_membership
    ADD CONSTRAINT projects_membership_invited_by_id_a2c6c913_fk_users_user_id FOREIGN KEY (invited_by_id) REFERENCES public.users_user(id) DEFERRABLE INITIALLY DEFERRED;
 y   ALTER TABLE ONLY public.projects_membership DROP CONSTRAINT projects_membership_invited_by_id_a2c6c913_fk_users_user_id;
       public          taiga    false    4090    213    207            �           2606    9871386 R   projects_membership projects_membership_project_id_5f65bf3f_fk_projects_project_id    FK CONSTRAINT     �   ALTER TABLE ONLY public.projects_membership
    ADD CONSTRAINT projects_membership_project_id_5f65bf3f_fk_projects_project_id FOREIGN KEY (project_id) REFERENCES public.projects_project(id) DEFERRABLE INITIALLY DEFERRED;
 |   ALTER TABLE ONLY public.projects_membership DROP CONSTRAINT projects_membership_project_id_5f65bf3f_fk_projects_project_id;
       public          taiga    false    213    215    4144            �           2606    9871392 I   projects_membership projects_membership_role_id_c4bd36ef_fk_users_role_id    FK CONSTRAINT     �   ALTER TABLE ONLY public.projects_membership
    ADD CONSTRAINT projects_membership_role_id_c4bd36ef_fk_users_role_id FOREIGN KEY (role_id) REFERENCES public.users_role(id) DEFERRABLE INITIALLY DEFERRED;
 s   ALTER TABLE ONLY public.projects_membership DROP CONSTRAINT projects_membership_role_id_c4bd36ef_fk_users_role_id;
       public          taiga    false    211    4104    213            �           2606    9871380 I   projects_membership projects_membership_user_id_13374535_fk_users_user_id    FK CONSTRAINT     �   ALTER TABLE ONLY public.projects_membership
    ADD CONSTRAINT projects_membership_user_id_13374535_fk_users_user_id FOREIGN KEY (user_id) REFERENCES public.users_user(id) DEFERRABLE INITIALLY DEFERRED;
 s   ALTER TABLE ONLY public.projects_membership DROP CONSTRAINT projects_membership_user_id_13374535_fk_users_user_id;
       public          taiga    false    213    207    4090            �           2606    9871506 J   projects_points projects_points_project_id_3b8f7b42_fk_projects_project_id    FK CONSTRAINT     �   ALTER TABLE ONLY public.projects_points
    ADD CONSTRAINT projects_points_project_id_3b8f7b42_fk_projects_project_id FOREIGN KEY (project_id) REFERENCES public.projects_project(id) DEFERRABLE INITIALLY DEFERRED;
 t   ALTER TABLE ONLY public.projects_points DROP CONSTRAINT projects_points_project_id_3b8f7b42_fk_projects_project_id;
       public          taiga    false    215    221    4144            �           2606    9871512 N   projects_priority projects_priority_project_id_936c75b2_fk_projects_project_id    FK CONSTRAINT     �   ALTER TABLE ONLY public.projects_priority
    ADD CONSTRAINT projects_priority_project_id_936c75b2_fk_projects_project_id FOREIGN KEY (project_id) REFERENCES public.projects_project(id) DEFERRABLE INITIALLY DEFERRED;
 x   ALTER TABLE ONLY public.projects_priority DROP CONSTRAINT projects_priority_project_id_936c75b2_fk_projects_project_id;
       public          taiga    false    215    4144    223            �           2606    9872464 L   projects_project projects_project_creation_template_id_b5a97819_fk_projects_    FK CONSTRAINT     �   ALTER TABLE ONLY public.projects_project
    ADD CONSTRAINT projects_project_creation_template_id_b5a97819_fk_projects_ FOREIGN KEY (creation_template_id) REFERENCES public.projects_projecttemplate(id) DEFERRABLE INITIALLY DEFERRED;
 v   ALTER TABLE ONLY public.projects_project DROP CONSTRAINT projects_project_creation_template_id_b5a97819_fk_projects_;
       public          taiga    false    225    215    4188            �           2606    9872457 L   projects_project projects_project_default_epic_status__1915e581_fk_projects_    FK CONSTRAINT     �   ALTER TABLE ONLY public.projects_project
    ADD CONSTRAINT projects_project_default_epic_status__1915e581_fk_projects_ FOREIGN KEY (default_epic_status_id) REFERENCES public.projects_epicstatus(id) DEFERRABLE INITIALLY DEFERRED;
 v   ALTER TABLE ONLY public.projects_project DROP CONSTRAINT projects_project_default_epic_status__1915e581_fk_projects_;
       public          taiga    false    4349    215    269            �           2606    9871543 L   projects_project projects_project_default_issue_status_6aebe7fd_fk_projects_    FK CONSTRAINT     �   ALTER TABLE ONLY public.projects_project
    ADD CONSTRAINT projects_project_default_issue_status_6aebe7fd_fk_projects_ FOREIGN KEY (default_issue_status_id) REFERENCES public.projects_issuestatus(id) DEFERRABLE INITIALLY DEFERRED;
 v   ALTER TABLE ONLY public.projects_project DROP CONSTRAINT projects_project_default_issue_status_6aebe7fd_fk_projects_;
       public          taiga    false    4164    215    217            �           2606    9871548 L   projects_project projects_project_default_issue_type_i_89e9b202_fk_projects_    FK CONSTRAINT     �   ALTER TABLE ONLY public.projects_project
    ADD CONSTRAINT projects_project_default_issue_type_i_89e9b202_fk_projects_ FOREIGN KEY (default_issue_type_id) REFERENCES public.projects_issuetype(id) DEFERRABLE INITIALLY DEFERRED;
 v   ALTER TABLE ONLY public.projects_project DROP CONSTRAINT projects_project_default_issue_type_i_89e9b202_fk_projects_;
       public          taiga    false    4173    219    215            �           2606    9871553 I   projects_project projects_project_default_points_id_6c6701c2_fk_projects_    FK CONSTRAINT     �   ALTER TABLE ONLY public.projects_project
    ADD CONSTRAINT projects_project_default_points_id_6c6701c2_fk_projects_ FOREIGN KEY (default_points_id) REFERENCES public.projects_points(id) DEFERRABLE INITIALLY DEFERRED;
 s   ALTER TABLE ONLY public.projects_project DROP CONSTRAINT projects_project_default_points_id_6c6701c2_fk_projects_;
       public          taiga    false    215    221    4178            �           2606    9871558 K   projects_project projects_project_default_priority_id_498ad5e0_fk_projects_    FK CONSTRAINT     �   ALTER TABLE ONLY public.projects_project
    ADD CONSTRAINT projects_project_default_priority_id_498ad5e0_fk_projects_ FOREIGN KEY (default_priority_id) REFERENCES public.projects_priority(id) DEFERRABLE INITIALLY DEFERRED;
 u   ALTER TABLE ONLY public.projects_project DROP CONSTRAINT projects_project_default_priority_id_498ad5e0_fk_projects_;
       public          taiga    false    215    4183    223            �           2606    9871563 K   projects_project projects_project_default_severity_id_34b7fa94_fk_projects_    FK CONSTRAINT     �   ALTER TABLE ONLY public.projects_project
    ADD CONSTRAINT projects_project_default_severity_id_34b7fa94_fk_projects_ FOREIGN KEY (default_severity_id) REFERENCES public.projects_severity(id) DEFERRABLE INITIALLY DEFERRED;
 u   ALTER TABLE ONLY public.projects_project DROP CONSTRAINT projects_project_default_severity_id_34b7fa94_fk_projects_;
       public          taiga    false    215    227    4193            �           2606    9873276 K   projects_project projects_project_default_swimlane_id_14643d1a_fk_projects_    FK CONSTRAINT     �   ALTER TABLE ONLY public.projects_project
    ADD CONSTRAINT projects_project_default_swimlane_id_14643d1a_fk_projects_ FOREIGN KEY (default_swimlane_id) REFERENCES public.projects_swimlane(id) DEFERRABLE INITIALLY DEFERRED;
 u   ALTER TABLE ONLY public.projects_project DROP CONSTRAINT projects_project_default_swimlane_id_14643d1a_fk_projects_;
       public          taiga    false    4499    320    215            �           2606    9871568 L   projects_project projects_project_default_task_status__3be95fee_fk_projects_    FK CONSTRAINT     �   ALTER TABLE ONLY public.projects_project
    ADD CONSTRAINT projects_project_default_task_status__3be95fee_fk_projects_ FOREIGN KEY (default_task_status_id) REFERENCES public.projects_taskstatus(id) DEFERRABLE INITIALLY DEFERRED;
 v   ALTER TABLE ONLY public.projects_project DROP CONSTRAINT projects_project_default_task_status__3be95fee_fk_projects_;
       public          taiga    false    229    4198    215            �           2606    9871573 L   projects_project projects_project_default_us_status_id_cc989d55_fk_projects_    FK CONSTRAINT     �   ALTER TABLE ONLY public.projects_project
    ADD CONSTRAINT projects_project_default_us_status_id_cc989d55_fk_projects_ FOREIGN KEY (default_us_status_id) REFERENCES public.projects_userstorystatus(id) DEFERRABLE INITIALLY DEFERRED;
 v   ALTER TABLE ONLY public.projects_project DROP CONSTRAINT projects_project_default_us_status_id_cc989d55_fk_projects_;
       public          taiga    false    215    4207    231            �           2606    9873230 D   projects_project projects_project_owner_id_b940de39_fk_users_user_id    FK CONSTRAINT     �   ALTER TABLE ONLY public.projects_project
    ADD CONSTRAINT projects_project_owner_id_b940de39_fk_users_user_id FOREIGN KEY (owner_id) REFERENCES public.users_user(id) DEFERRABLE INITIALLY DEFERRED;
 n   ALTER TABLE ONLY public.projects_project DROP CONSTRAINT projects_project_owner_id_b940de39_fk_users_user_id;
       public          taiga    false    215    207    4090            �           2606    9873284 D   projects_project projects_project_workspace_id_7ea54f67_fk_workspace    FK CONSTRAINT     �   ALTER TABLE ONLY public.projects_project
    ADD CONSTRAINT projects_project_workspace_id_7ea54f67_fk_workspace FOREIGN KEY (workspace_id) REFERENCES public.workspaces_workspace(id) DEFERRABLE INITIALLY DEFERRED;
 n   ALTER TABLE ONLY public.projects_project DROP CONSTRAINT projects_project_workspace_id_7ea54f67_fk_workspace;
       public          taiga    false    312    215    4479            *           2606    9872261 S   projects_projectmodulesconfig projects_projectmodu_project_id_eff1c253_fk_projects_    FK CONSTRAINT     �   ALTER TABLE ONLY public.projects_projectmodulesconfig
    ADD CONSTRAINT projects_projectmodu_project_id_eff1c253_fk_projects_ FOREIGN KEY (project_id) REFERENCES public.projects_project(id) DEFERRABLE INITIALLY DEFERRED;
 }   ALTER TABLE ONLY public.projects_projectmodulesconfig DROP CONSTRAINT projects_projectmodu_project_id_eff1c253_fk_projects_;
       public          taiga    false    215    4144    263            �           2606    9871519 N   projects_severity projects_severity_project_id_9ab920cd_fk_projects_project_id    FK CONSTRAINT     �   ALTER TABLE ONLY public.projects_severity
    ADD CONSTRAINT projects_severity_project_id_9ab920cd_fk_projects_project_id FOREIGN KEY (project_id) REFERENCES public.projects_project(id) DEFERRABLE INITIALLY DEFERRED;
 x   ALTER TABLE ONLY public.projects_severity DROP CONSTRAINT projects_severity_project_id_9ab920cd_fk_projects_project_id;
       public          taiga    false    215    227    4144            O           2606    9873246 N   projects_swimlane projects_swimlane_project_id_06871cf8_fk_projects_project_id    FK CONSTRAINT     �   ALTER TABLE ONLY public.projects_swimlane
    ADD CONSTRAINT projects_swimlane_project_id_06871cf8_fk_projects_project_id FOREIGN KEY (project_id) REFERENCES public.projects_project(id) DEFERRABLE INITIALLY DEFERRED;
 x   ALTER TABLE ONLY public.projects_swimlane DROP CONSTRAINT projects_swimlane_project_id_06871cf8_fk_projects_project_id;
       public          taiga    false    4144    320    215            P           2606    9873260 U   projects_swimlaneuserstorystatus projects_swimlaneuse_status_id_2f3fda91_fk_projects_    FK CONSTRAINT     �   ALTER TABLE ONLY public.projects_swimlaneuserstorystatus
    ADD CONSTRAINT projects_swimlaneuse_status_id_2f3fda91_fk_projects_ FOREIGN KEY (status_id) REFERENCES public.projects_userstorystatus(id) DEFERRABLE INITIALLY DEFERRED;
    ALTER TABLE ONLY public.projects_swimlaneuserstorystatus DROP CONSTRAINT projects_swimlaneuse_status_id_2f3fda91_fk_projects_;
       public          taiga    false    322    4207    231            Q           2606    9873265 W   projects_swimlaneuserstorystatus projects_swimlaneuse_swimlane_id_1d3f2b21_fk_projects_    FK CONSTRAINT     �   ALTER TABLE ONLY public.projects_swimlaneuserstorystatus
    ADD CONSTRAINT projects_swimlaneuse_swimlane_id_1d3f2b21_fk_projects_ FOREIGN KEY (swimlane_id) REFERENCES public.projects_swimlane(id) DEFERRABLE INITIALLY DEFERRED;
 �   ALTER TABLE ONLY public.projects_swimlaneuserstorystatus DROP CONSTRAINT projects_swimlaneuse_swimlane_id_1d3f2b21_fk_projects_;
       public          taiga    false    320    322    4499            M           2606    9873216 T   projects_taskduedate projects_taskduedate_project_id_775d850d_fk_projects_project_id    FK CONSTRAINT     �   ALTER TABLE ONLY public.projects_taskduedate
    ADD CONSTRAINT projects_taskduedate_project_id_775d850d_fk_projects_project_id FOREIGN KEY (project_id) REFERENCES public.projects_project(id) DEFERRABLE INITIALLY DEFERRED;
 ~   ALTER TABLE ONLY public.projects_taskduedate DROP CONSTRAINT projects_taskduedate_project_id_775d850d_fk_projects_project_id;
       public          taiga    false    4144    215    316            �           2606    9871525 R   projects_taskstatus projects_taskstatus_project_id_8b32b2bb_fk_projects_project_id    FK CONSTRAINT     �   ALTER TABLE ONLY public.projects_taskstatus
    ADD CONSTRAINT projects_taskstatus_project_id_8b32b2bb_fk_projects_project_id FOREIGN KEY (project_id) REFERENCES public.projects_project(id) DEFERRABLE INITIALLY DEFERRED;
 |   ALTER TABLE ONLY public.projects_taskstatus DROP CONSTRAINT projects_taskstatus_project_id_8b32b2bb_fk_projects_project_id;
       public          taiga    false    215    4144    229            N           2606    9873222 O   projects_userstoryduedate projects_userstorydu_project_id_ab7b1680_fk_projects_    FK CONSTRAINT     �   ALTER TABLE ONLY public.projects_userstoryduedate
    ADD CONSTRAINT projects_userstorydu_project_id_ab7b1680_fk_projects_ FOREIGN KEY (project_id) REFERENCES public.projects_project(id) DEFERRABLE INITIALLY DEFERRED;
 y   ALTER TABLE ONLY public.projects_userstoryduedate DROP CONSTRAINT projects_userstorydu_project_id_ab7b1680_fk_projects_;
       public          taiga    false    318    215    4144            �           2606    9871531 N   projects_userstorystatus projects_userstoryst_project_id_cdf95c9c_fk_projects_    FK CONSTRAINT     �   ALTER TABLE ONLY public.projects_userstorystatus
    ADD CONSTRAINT projects_userstoryst_project_id_cdf95c9c_fk_projects_ FOREIGN KEY (project_id) REFERENCES public.projects_project(id) DEFERRABLE INITIALLY DEFERRED;
 x   ALTER TABLE ONLY public.projects_userstorystatus DROP CONSTRAINT projects_userstoryst_project_id_cdf95c9c_fk_projects_;
       public          taiga    false    215    4144    231            R           2606    9873302 O   references_reference references_reference_content_type_id_c134e05e_fk_django_co    FK CONSTRAINT     �   ALTER TABLE ONLY public.references_reference
    ADD CONSTRAINT references_reference_content_type_id_c134e05e_fk_django_co FOREIGN KEY (content_type_id) REFERENCES public.django_content_type(id) DEFERRABLE INITIALLY DEFERRED;
 y   ALTER TABLE ONLY public.references_reference DROP CONSTRAINT references_reference_content_type_id_c134e05e_fk_django_co;
       public          taiga    false    324    4085    205            S           2606    9873307 T   references_reference references_reference_project_id_00275368_fk_projects_project_id    FK CONSTRAINT     �   ALTER TABLE ONLY public.references_reference
    ADD CONSTRAINT references_reference_project_id_00275368_fk_projects_project_id FOREIGN KEY (project_id) REFERENCES public.projects_project(id) DEFERRABLE INITIALLY DEFERRED;
 ~   ALTER TABLE ONLY public.references_reference DROP CONSTRAINT references_reference_project_id_00275368_fk_projects_project_id;
       public          taiga    false    324    4144    215            T           2606    9873334 R   settings_userprojectsettings settings_userproject_project_id_0bc686ce_fk_projects_    FK CONSTRAINT     �   ALTER TABLE ONLY public.settings_userprojectsettings
    ADD CONSTRAINT settings_userproject_project_id_0bc686ce_fk_projects_ FOREIGN KEY (project_id) REFERENCES public.projects_project(id) DEFERRABLE INITIALLY DEFERRED;
 |   ALTER TABLE ONLY public.settings_userprojectsettings DROP CONSTRAINT settings_userproject_project_id_0bc686ce_fk_projects_;
       public          taiga    false    215    4144    327            U           2606    9873339 [   settings_userprojectsettings settings_userprojectsettings_user_id_0e7fdc25_fk_users_user_id    FK CONSTRAINT     �   ALTER TABLE ONLY public.settings_userprojectsettings
    ADD CONSTRAINT settings_userprojectsettings_user_id_0e7fdc25_fk_users_user_id FOREIGN KEY (user_id) REFERENCES public.users_user(id) DEFERRABLE INITIALLY DEFERRED;
 �   ALTER TABLE ONLY public.settings_userprojectsettings DROP CONSTRAINT settings_userprojectsettings_user_id_0e7fdc25_fk_users_user_id;
       public          taiga    false    327    4090    207            #           2606    9872111 >   tasks_task tasks_task_assigned_to_id_e8821f61_fk_users_user_id    FK CONSTRAINT     �   ALTER TABLE ONLY public.tasks_task
    ADD CONSTRAINT tasks_task_assigned_to_id_e8821f61_fk_users_user_id FOREIGN KEY (assigned_to_id) REFERENCES public.users_user(id) DEFERRABLE INITIALLY DEFERRED;
 h   ALTER TABLE ONLY public.tasks_task DROP CONSTRAINT tasks_task_assigned_to_id_e8821f61_fk_users_user_id;
       public          taiga    false    207    4090    259            '           2606    9872169 F   tasks_task tasks_task_milestone_id_64cc568f_fk_milestones_milestone_id    FK CONSTRAINT     �   ALTER TABLE ONLY public.tasks_task
    ADD CONSTRAINT tasks_task_milestone_id_64cc568f_fk_milestones_milestone_id FOREIGN KEY (milestone_id) REFERENCES public.milestones_milestone(id) DEFERRABLE INITIALLY DEFERRED;
 p   ALTER TABLE ONLY public.tasks_task DROP CONSTRAINT tasks_task_milestone_id_64cc568f_fk_milestones_milestone_id;
       public          taiga    false    241    4243    259            $           2606    9872121 8   tasks_task tasks_task_owner_id_db3dcc3e_fk_users_user_id    FK CONSTRAINT     �   ALTER TABLE ONLY public.tasks_task
    ADD CONSTRAINT tasks_task_owner_id_db3dcc3e_fk_users_user_id FOREIGN KEY (owner_id) REFERENCES public.users_user(id) DEFERRABLE INITIALLY DEFERRED;
 b   ALTER TABLE ONLY public.tasks_task DROP CONSTRAINT tasks_task_owner_id_db3dcc3e_fk_users_user_id;
       public          taiga    false    4090    207    259            %           2606    9872126 @   tasks_task tasks_task_project_id_a2815f0c_fk_projects_project_id    FK CONSTRAINT     �   ALTER TABLE ONLY public.tasks_task
    ADD CONSTRAINT tasks_task_project_id_a2815f0c_fk_projects_project_id FOREIGN KEY (project_id) REFERENCES public.projects_project(id) DEFERRABLE INITIALLY DEFERRED;
 j   ALTER TABLE ONLY public.tasks_task DROP CONSTRAINT tasks_task_project_id_a2815f0c_fk_projects_project_id;
       public          taiga    false    215    259    4144            &           2606    9872164 B   tasks_task tasks_task_status_id_899d2b90_fk_projects_taskstatus_id    FK CONSTRAINT     �   ALTER TABLE ONLY public.tasks_task
    ADD CONSTRAINT tasks_task_status_id_899d2b90_fk_projects_taskstatus_id FOREIGN KEY (status_id) REFERENCES public.projects_taskstatus(id) DEFERRABLE INITIALLY DEFERRED;
 l   ALTER TABLE ONLY public.tasks_task DROP CONSTRAINT tasks_task_status_id_899d2b90_fk_projects_taskstatus_id;
       public          taiga    false    229    259    4198            (           2606    9873375 H   tasks_task tasks_task_user_story_id_47ceaf1d_fk_userstories_userstory_id    FK CONSTRAINT     �   ALTER TABLE ONLY public.tasks_task
    ADD CONSTRAINT tasks_task_user_story_id_47ceaf1d_fk_userstories_userstory_id FOREIGN KEY (user_story_id) REFERENCES public.userstories_userstory(id) DEFERRABLE INITIALLY DEFERRED;
 r   ALTER TABLE ONLY public.tasks_task DROP CONSTRAINT tasks_task_user_story_id_47ceaf1d_fk_userstories_userstory_id;
       public          taiga    false    4273    247    259            ,           2606    9872296 I   timeline_timeline timeline_timeline_content_type_id_5731a0c6_fk_django_co    FK CONSTRAINT     �   ALTER TABLE ONLY public.timeline_timeline
    ADD CONSTRAINT timeline_timeline_content_type_id_5731a0c6_fk_django_co FOREIGN KEY (content_type_id) REFERENCES public.django_content_type(id) DEFERRABLE INITIALLY DEFERRED;
 s   ALTER TABLE ONLY public.timeline_timeline DROP CONSTRAINT timeline_timeline_content_type_id_5731a0c6_fk_django_co;
       public          taiga    false    205    4085    265            +           2606    9872291 N   timeline_timeline timeline_timeline_data_content_type_id_0689742e_fk_django_co    FK CONSTRAINT     �   ALTER TABLE ONLY public.timeline_timeline
    ADD CONSTRAINT timeline_timeline_data_content_type_id_0689742e_fk_django_co FOREIGN KEY (data_content_type_id) REFERENCES public.django_content_type(id) DEFERRABLE INITIALLY DEFERRED;
 x   ALTER TABLE ONLY public.timeline_timeline DROP CONSTRAINT timeline_timeline_data_content_type_id_0689742e_fk_django_co;
       public          taiga    false    205    265    4085            -           2606    9872313 N   timeline_timeline timeline_timeline_project_id_58d5eadd_fk_projects_project_id    FK CONSTRAINT     �   ALTER TABLE ONLY public.timeline_timeline
    ADD CONSTRAINT timeline_timeline_project_id_58d5eadd_fk_projects_project_id FOREIGN KEY (project_id) REFERENCES public.projects_project(id) DEFERRABLE INITIALLY DEFERRED;
 x   ALTER TABLE ONLY public.timeline_timeline DROP CONSTRAINT timeline_timeline_project_id_58d5eadd_fk_projects_project_id;
       public          taiga    false    4144    215    265            W           2606    9873438 R   token_denylist_denylistedtoken token_denylist_denyl_token_id_dca79910_fk_token_den    FK CONSTRAINT     �   ALTER TABLE ONLY public.token_denylist_denylistedtoken
    ADD CONSTRAINT token_denylist_denyl_token_id_dca79910_fk_token_den FOREIGN KEY (token_id) REFERENCES public.token_denylist_outstandingtoken(id) DEFERRABLE INITIALLY DEFERRED;
 |   ALTER TABLE ONLY public.token_denylist_denylistedtoken DROP CONSTRAINT token_denylist_denyl_token_id_dca79910_fk_token_den;
       public          taiga    false    331    4531    333            V           2606    9873431 R   token_denylist_outstandingtoken token_denylist_outst_user_id_c6f48986_fk_users_use    FK CONSTRAINT     �   ALTER TABLE ONLY public.token_denylist_outstandingtoken
    ADD CONSTRAINT token_denylist_outst_user_id_c6f48986_fk_users_use FOREIGN KEY (user_id) REFERENCES public.users_user(id) DEFERRABLE INITIALLY DEFERRED;
 |   ALTER TABLE ONLY public.token_denylist_outstandingtoken DROP CONSTRAINT token_denylist_outst_user_id_c6f48986_fk_users_use;
       public          taiga    false    331    4090    207            )           2606    9872195 ?   users_authdata users_authdata_user_id_9625853a_fk_users_user_id    FK CONSTRAINT     �   ALTER TABLE ONLY public.users_authdata
    ADD CONSTRAINT users_authdata_user_id_9625853a_fk_users_user_id FOREIGN KEY (user_id) REFERENCES public.users_user(id) DEFERRABLE INITIALLY DEFERRED;
 i   ALTER TABLE ONLY public.users_authdata DROP CONSTRAINT users_authdata_user_id_9625853a_fk_users_user_id;
       public          taiga    false    4090    261    207            �           2606    9871672 @   users_role users_role_project_id_2837f877_fk_projects_project_id    FK CONSTRAINT     �   ALTER TABLE ONLY public.users_role
    ADD CONSTRAINT users_role_project_id_2837f877_fk_projects_project_id FOREIGN KEY (project_id) REFERENCES public.projects_project(id) DEFERRABLE INITIALLY DEFERRED;
 j   ALTER TABLE ONLY public.users_role DROP CONSTRAINT users_role_project_id_2837f877_fk_projects_project_id;
       public          taiga    false    215    211    4144            X           2606    9873476 J   users_workspacerole users_workspacerole_workspace_id_30155f00_fk_workspace    FK CONSTRAINT     �   ALTER TABLE ONLY public.users_workspacerole
    ADD CONSTRAINT users_workspacerole_workspace_id_30155f00_fk_workspace FOREIGN KEY (workspace_id) REFERENCES public.workspaces_workspace(id) DEFERRABLE INITIALLY DEFERRED;
 t   ALTER TABLE ONLY public.users_workspacerole DROP CONSTRAINT users_workspacerole_workspace_id_30155f00_fk_workspace;
       public          taiga    false    335    312    4479            Y           2606    9873499 T   userstorage_storageentry userstorage_storageentry_owner_id_c4c1ffc0_fk_users_user_id    FK CONSTRAINT     �   ALTER TABLE ONLY public.userstorage_storageentry
    ADD CONSTRAINT userstorage_storageentry_owner_id_c4c1ffc0_fk_users_user_id FOREIGN KEY (owner_id) REFERENCES public.users_user(id) DEFERRABLE INITIALLY DEFERRED;
 ~   ALTER TABLE ONLY public.userstorage_storageentry DROP CONSTRAINT userstorage_storageentry_owner_id_c4c1ffc0_fk_users_user_id;
       public          taiga    false    4090    207    337                       2606    9871912 O   userstories_rolepoints userstories_rolepoin_user_story_id_ddb4c558_fk_userstori    FK CONSTRAINT     �   ALTER TABLE ONLY public.userstories_rolepoints
    ADD CONSTRAINT userstories_rolepoin_user_story_id_ddb4c558_fk_userstori FOREIGN KEY (user_story_id) REFERENCES public.userstories_userstory(id) DEFERRABLE INITIALLY DEFERRED;
 y   ALTER TABLE ONLY public.userstories_rolepoints DROP CONSTRAINT userstories_rolepoin_user_story_id_ddb4c558_fk_userstori;
       public          taiga    false    247    4273    245                       2606    9871917 V   userstories_rolepoints userstories_rolepoints_points_id_cfcc5a79_fk_projects_points_id    FK CONSTRAINT     �   ALTER TABLE ONLY public.userstories_rolepoints
    ADD CONSTRAINT userstories_rolepoints_points_id_cfcc5a79_fk_projects_points_id FOREIGN KEY (points_id) REFERENCES public.projects_points(id) DEFERRABLE INITIALLY DEFERRED;
 �   ALTER TABLE ONLY public.userstories_rolepoints DROP CONSTRAINT userstories_rolepoints_points_id_cfcc5a79_fk_projects_points_id;
       public          taiga    false    4178    221    245                       2606    9871853 O   userstories_rolepoints userstories_rolepoints_role_id_94ac7663_fk_users_role_id    FK CONSTRAINT     �   ALTER TABLE ONLY public.userstories_rolepoints
    ADD CONSTRAINT userstories_rolepoints_role_id_94ac7663_fk_users_role_id FOREIGN KEY (role_id) REFERENCES public.users_role(id) DEFERRABLE INITIALLY DEFERRED;
 y   ALTER TABLE ONLY public.userstories_rolepoints DROP CONSTRAINT userstories_rolepoints_role_id_94ac7663_fk_users_role_id;
       public          taiga    false    4104    211    245                       2606    9871939 U   userstories_userstory userstories_userstor_generated_from_issue_afe43198_fk_issues_is    FK CONSTRAINT     �   ALTER TABLE ONLY public.userstories_userstory
    ADD CONSTRAINT userstories_userstor_generated_from_issue_afe43198_fk_issues_is FOREIGN KEY (generated_from_issue_id) REFERENCES public.issues_issue(id) DEFERRABLE INITIALLY DEFERRED;
    ALTER TABLE ONLY public.userstories_userstory DROP CONSTRAINT userstories_userstor_generated_from_issue_afe43198_fk_issues_is;
       public          taiga    false    247    243    4253                       2606    9873580 U   userstories_userstory userstories_userstor_generated_from_task__8e958d43_fk_tasks_tas    FK CONSTRAINT     �   ALTER TABLE ONLY public.userstories_userstory
    ADD CONSTRAINT userstories_userstor_generated_from_task__8e958d43_fk_tasks_tas FOREIGN KEY (generated_from_task_id) REFERENCES public.tasks_task(id) DEFERRABLE INITIALLY DEFERRED;
    ALTER TABLE ONLY public.userstories_userstory DROP CONSTRAINT userstories_userstor_generated_from_task__8e958d43_fk_tasks_tas;
       public          taiga    false    259    4314    247                       2606    9871870 M   userstories_userstory userstories_userstor_milestone_id_37f31d22_fk_milestone    FK CONSTRAINT     �   ALTER TABLE ONLY public.userstories_userstory
    ADD CONSTRAINT userstories_userstor_milestone_id_37f31d22_fk_milestone FOREIGN KEY (milestone_id) REFERENCES public.milestones_milestone(id) DEFERRABLE INITIALLY DEFERRED;
 w   ALTER TABLE ONLY public.userstories_userstory DROP CONSTRAINT userstories_userstor_milestone_id_37f31d22_fk_milestone;
       public          taiga    false    247    241    4243                       2606    9871880 K   userstories_userstory userstories_userstor_project_id_03e85e9c_fk_projects_    FK CONSTRAINT     �   ALTER TABLE ONLY public.userstories_userstory
    ADD CONSTRAINT userstories_userstor_project_id_03e85e9c_fk_projects_ FOREIGN KEY (project_id) REFERENCES public.projects_project(id) DEFERRABLE INITIALLY DEFERRED;
 u   ALTER TABLE ONLY public.userstories_userstory DROP CONSTRAINT userstories_userstor_project_id_03e85e9c_fk_projects_;
       public          taiga    false    4144    247    215                       2606    9871885 J   userstories_userstory userstories_userstor_status_id_858671dd_fk_projects_    FK CONSTRAINT     �   ALTER TABLE ONLY public.userstories_userstory
    ADD CONSTRAINT userstories_userstor_status_id_858671dd_fk_projects_ FOREIGN KEY (status_id) REFERENCES public.projects_userstorystatus(id) DEFERRABLE INITIALLY DEFERRED;
 t   ALTER TABLE ONLY public.userstories_userstory DROP CONSTRAINT userstories_userstor_status_id_858671dd_fk_projects_;
       public          taiga    false    247    4207    231                       2606    9873591 L   userstories_userstory userstories_userstor_swimlane_id_8ecab79d_fk_projects_    FK CONSTRAINT     �   ALTER TABLE ONLY public.userstories_userstory
    ADD CONSTRAINT userstories_userstor_swimlane_id_8ecab79d_fk_projects_ FOREIGN KEY (swimlane_id) REFERENCES public.projects_swimlane(id) DEFERRABLE INITIALLY DEFERRED;
 v   ALTER TABLE ONLY public.userstories_userstory DROP CONSTRAINT userstories_userstor_swimlane_id_8ecab79d_fk_projects_;
       public          taiga    false    4499    320    247            [           2606    9873570 W   userstories_userstory_assigned_users userstories_userstor_user_id_6de6e8a7_fk_users_use    FK CONSTRAINT     �   ALTER TABLE ONLY public.userstories_userstory_assigned_users
    ADD CONSTRAINT userstories_userstor_user_id_6de6e8a7_fk_users_use FOREIGN KEY (user_id) REFERENCES public.users_user(id) DEFERRABLE INITIALLY DEFERRED;
 �   ALTER TABLE ONLY public.userstories_userstory_assigned_users DROP CONSTRAINT userstories_userstor_user_id_6de6e8a7_fk_users_use;
       public          taiga    false    339    207    4090            Z           2606    9873565 \   userstories_userstory_assigned_users userstories_userstor_userstory_id_fcb98e26_fk_userstori    FK CONSTRAINT     �   ALTER TABLE ONLY public.userstories_userstory_assigned_users
    ADD CONSTRAINT userstories_userstor_userstory_id_fcb98e26_fk_userstori FOREIGN KEY (userstory_id) REFERENCES public.userstories_userstory(id) DEFERRABLE INITIALLY DEFERRED;
 �   ALTER TABLE ONLY public.userstories_userstory_assigned_users DROP CONSTRAINT userstories_userstor_userstory_id_fcb98e26_fk_userstori;
       public          taiga    false    247    339    4273                       2606    9871860 T   userstories_userstory userstories_userstory_assigned_to_id_5ba80653_fk_users_user_id    FK CONSTRAINT     �   ALTER TABLE ONLY public.userstories_userstory
    ADD CONSTRAINT userstories_userstory_assigned_to_id_5ba80653_fk_users_user_id FOREIGN KEY (assigned_to_id) REFERENCES public.users_user(id) DEFERRABLE INITIALLY DEFERRED;
 ~   ALTER TABLE ONLY public.userstories_userstory DROP CONSTRAINT userstories_userstory_assigned_to_id_5ba80653_fk_users_user_id;
       public          taiga    false    207    4090    247                       2606    9873585 N   userstories_userstory userstories_userstory_owner_id_df53c64e_fk_users_user_id    FK CONSTRAINT     �   ALTER TABLE ONLY public.userstories_userstory
    ADD CONSTRAINT userstories_userstory_owner_id_df53c64e_fk_users_user_id FOREIGN KEY (owner_id) REFERENCES public.users_user(id) DEFERRABLE INITIALLY DEFERRED;
 x   ALTER TABLE ONLY public.userstories_userstory DROP CONSTRAINT userstories_userstory_owner_id_df53c64e_fk_users_user_id;
       public          taiga    false    207    4090    247            \           2606    9873619 H   votes_vote votes_vote_content_type_id_c8375fe1_fk_django_content_type_id    FK CONSTRAINT     �   ALTER TABLE ONLY public.votes_vote
    ADD CONSTRAINT votes_vote_content_type_id_c8375fe1_fk_django_content_type_id FOREIGN KEY (content_type_id) REFERENCES public.django_content_type(id) DEFERRABLE INITIALLY DEFERRED;
 r   ALTER TABLE ONLY public.votes_vote DROP CONSTRAINT votes_vote_content_type_id_c8375fe1_fk_django_content_type_id;
       public          taiga    false    341    4085    205            ]           2606    9873638 7   votes_vote votes_vote_user_id_24a74629_fk_users_user_id    FK CONSTRAINT     �   ALTER TABLE ONLY public.votes_vote
    ADD CONSTRAINT votes_vote_user_id_24a74629_fk_users_user_id FOREIGN KEY (user_id) REFERENCES public.users_user(id) DEFERRABLE INITIALLY DEFERRED;
 a   ALTER TABLE ONLY public.votes_vote DROP CONSTRAINT votes_vote_user_id_24a74629_fk_users_user_id;
       public          taiga    false    4090    207    341            ^           2606    9873631 J   votes_votes votes_votes_content_type_id_29583576_fk_django_content_type_id    FK CONSTRAINT     �   ALTER TABLE ONLY public.votes_votes
    ADD CONSTRAINT votes_votes_content_type_id_29583576_fk_django_content_type_id FOREIGN KEY (content_type_id) REFERENCES public.django_content_type(id) DEFERRABLE INITIALLY DEFERRED;
 t   ALTER TABLE ONLY public.votes_votes DROP CONSTRAINT votes_votes_content_type_id_29583576_fk_django_content_type_id;
       public          taiga    false    205    4085    343            _           2606    9873665 L   webhooks_webhook webhooks_webhook_project_id_76846b5e_fk_projects_project_id    FK CONSTRAINT     �   ALTER TABLE ONLY public.webhooks_webhook
    ADD CONSTRAINT webhooks_webhook_project_id_76846b5e_fk_projects_project_id FOREIGN KEY (project_id) REFERENCES public.projects_project(id) DEFERRABLE INITIALLY DEFERRED;
 v   ALTER TABLE ONLY public.webhooks_webhook DROP CONSTRAINT webhooks_webhook_project_id_76846b5e_fk_projects_project_id;
       public          taiga    false    345    215    4144            `           2606    9873671 R   webhooks_webhooklog webhooks_webhooklog_webhook_id_646c2008_fk_webhooks_webhook_id    FK CONSTRAINT     �   ALTER TABLE ONLY public.webhooks_webhooklog
    ADD CONSTRAINT webhooks_webhooklog_webhook_id_646c2008_fk_webhooks_webhook_id FOREIGN KEY (webhook_id) REFERENCES public.webhooks_webhook(id) DEFERRABLE INITIALLY DEFERRED;
 |   ALTER TABLE ONLY public.webhooks_webhooklog DROP CONSTRAINT webhooks_webhooklog_webhook_id_646c2008_fk_webhooks_webhook_id;
       public          taiga    false    345    4567    347            3           2606    9872567 F   wiki_wikilink wiki_wikilink_project_id_7dc700d7_fk_projects_project_id    FK CONSTRAINT     �   ALTER TABLE ONLY public.wiki_wikilink
    ADD CONSTRAINT wiki_wikilink_project_id_7dc700d7_fk_projects_project_id FOREIGN KEY (project_id) REFERENCES public.projects_project(id) DEFERRABLE INITIALLY DEFERRED;
 p   ALTER TABLE ONLY public.wiki_wikilink DROP CONSTRAINT wiki_wikilink_project_id_7dc700d7_fk_projects_project_id;
       public          taiga    false    215    273    4144            4           2606    9872575 F   wiki_wikipage wiki_wikipage_last_modifier_id_38be071c_fk_users_user_id    FK CONSTRAINT     �   ALTER TABLE ONLY public.wiki_wikipage
    ADD CONSTRAINT wiki_wikipage_last_modifier_id_38be071c_fk_users_user_id FOREIGN KEY (last_modifier_id) REFERENCES public.users_user(id) DEFERRABLE INITIALLY DEFERRED;
 p   ALTER TABLE ONLY public.wiki_wikipage DROP CONSTRAINT wiki_wikipage_last_modifier_id_38be071c_fk_users_user_id;
       public          taiga    false    207    275    4090            5           2606    9872580 >   wiki_wikipage wiki_wikipage_owner_id_f1f6c5fd_fk_users_user_id    FK CONSTRAINT     �   ALTER TABLE ONLY public.wiki_wikipage
    ADD CONSTRAINT wiki_wikipage_owner_id_f1f6c5fd_fk_users_user_id FOREIGN KEY (owner_id) REFERENCES public.users_user(id) DEFERRABLE INITIALLY DEFERRED;
 h   ALTER TABLE ONLY public.wiki_wikipage DROP CONSTRAINT wiki_wikipage_owner_id_f1f6c5fd_fk_users_user_id;
       public          taiga    false    275    4090    207            6           2606    9872585 F   wiki_wikipage wiki_wikipage_project_id_03a1e2ca_fk_projects_project_id    FK CONSTRAINT     �   ALTER TABLE ONLY public.wiki_wikipage
    ADD CONSTRAINT wiki_wikipage_project_id_03a1e2ca_fk_projects_project_id FOREIGN KEY (project_id) REFERENCES public.projects_project(id) DEFERRABLE INITIALLY DEFERRED;
 p   ALTER TABLE ONLY public.wiki_wikipage DROP CONSTRAINT wiki_wikipage_project_id_03a1e2ca_fk_projects_project_id;
       public          taiga    false    275    215    4144            K           2606    9873167 L   workspaces_workspace workspaces_workspace_owner_id_d8b120c0_fk_users_user_id    FK CONSTRAINT     �   ALTER TABLE ONLY public.workspaces_workspace
    ADD CONSTRAINT workspaces_workspace_owner_id_d8b120c0_fk_users_user_id FOREIGN KEY (owner_id) REFERENCES public.users_user(id) DEFERRABLE INITIALLY DEFERRED;
 v   ALTER TABLE ONLY public.workspaces_workspace DROP CONSTRAINT workspaces_workspace_owner_id_d8b120c0_fk_users_user_id;
       public          taiga    false    312    207    4090            a           2606    9873709 Q   workspaces_workspacemembership workspaces_workspace_user_id_091e94f3_fk_users_use    FK CONSTRAINT     �   ALTER TABLE ONLY public.workspaces_workspacemembership
    ADD CONSTRAINT workspaces_workspace_user_id_091e94f3_fk_users_use FOREIGN KEY (user_id) REFERENCES public.users_user(id) DEFERRABLE INITIALLY DEFERRED;
 {   ALTER TABLE ONLY public.workspaces_workspacemembership DROP CONSTRAINT workspaces_workspace_user_id_091e94f3_fk_users_use;
       public          taiga    false    349    207    4090            b           2606    9873714 V   workspaces_workspacemembership workspaces_workspace_workspace_id_d634b215_fk_workspace    FK CONSTRAINT     �   ALTER TABLE ONLY public.workspaces_workspacemembership
    ADD CONSTRAINT workspaces_workspace_workspace_id_d634b215_fk_workspace FOREIGN KEY (workspace_id) REFERENCES public.workspaces_workspace(id) DEFERRABLE INITIALLY DEFERRED;
 �   ALTER TABLE ONLY public.workspaces_workspacemembership DROP CONSTRAINT workspaces_workspace_workspace_id_d634b215_fk_workspace;
       public          taiga    false    349    312    4479            c           2606    9873719 [   workspaces_workspacemembership workspaces_workspace_workspace_role_id_39c459bf_fk_users_wor    FK CONSTRAINT     �   ALTER TABLE ONLY public.workspaces_workspacemembership
    ADD CONSTRAINT workspaces_workspace_workspace_role_id_39c459bf_fk_users_wor FOREIGN KEY (workspace_role_id) REFERENCES public.users_workspacerole(id) DEFERRABLE INITIALLY DEFERRED;
 �   ALTER TABLE ONLY public.workspaces_workspacemembership DROP CONSTRAINT workspaces_workspace_workspace_role_id_39c459bf_fk_users_wor;
       public          taiga    false    349    335    4538                  xڋ���� � �            xڋ���� � �            xڋ���� � �         �
  xڍ��r�:���S�	nY��z�3ۙͭ�Rlu��m�l�Sy��H�8 ����E~e$!�"��p����6�/��1�׬�L��!/-u���]��eO�y\"ֵ![[��4~IrmA�	^����-+����y��Q�w�zD�w��������8_����ۘU�	ߴ���}�`���,⽃�/�ψ��
�
^?F�^k�ʋ�e���}d̻��]c�z�.xt��w���w�X�̳}̋:��w���B�{�rϮ!g�c��=�=k�c�?�RL���q����n8 &���u����1��_^���br�^�� ��_v Lm�m����=<���iX���~}^�J�iļL�ٌ�w�I���YϘ��5�?���x�.�F;�JLg%��F1��ƻi`�+�@��,�}0ι	h��G��&a%���)4�Dā�P�����P��Ș��c�����[����j�V@�m�k3I����hJJ����,)���2���x�>O�e<�ȭ5��%"2S*?<%���)!DrJf��D��y:�]a��My#�\����h�<<��va�l��ZǾ��6�� X�����XX�G�mrX,��e�.��m�?>�[V�Ր[�F$��� -r��� �n!H���$g��}��x\�­��1o��!�'w���ސ8�2����pԚm�sM~��|d�sͶ������G!Q��B ���k���vWv���u{�5�賃�1�诃��[B�Wr$��麘�e�=�:F�g���/��G��3�'�D�p���򝕵���9�r&2�"����L�����g#s~:��d����yX���p����
�����T	�(��2�05p��=��7�4��C+�����<Q0�D�P��?V�Ѵ��xn�^�|��"�"�{������"1��_D+qְ��o�>�<l;i���dp$�&>�(%�U��������T\���<>�C��=+:�������
	m@Fd�OE��!cD�(�{)��Kd g�?��1�=~6�>���6�[u���ɿ�b/�D�� x�"ޏY�"��+�x�=���ɣ<��e�6�'^T�2Ƣ��"\�X�`��Ƃ(m0^���B��!y�D��@aI�BP���4B&�m���Ʉ�[��qBau:��V&V�A�k�����]��g�4p�
1*΀�2P� !��!�
�a"mV{�s�=Ym��P4(m�J�1m+��U뗐�$^�����x�G��p�uh0�,}!I0�ea*��%1D]a�x�~|��\vòܧ��a����}yQ%��)���Ķ>es�6���)�#��J�J-oB���Z�Δr�6Ѩ\�29U�h�ܚ2r��w�\�m�2�j;��ܛ2�`m����)kqNVְ.����R�"r���ٜ��z�A�k��@B�?۬^���!��f�*���f�����֪~+��V�2��v0���eL����d��!���B����l��c���N���_2/�0�����f���7��1��p%O2:aT�L�R�,�n�ᘣM4꼓2'm���@)�0����o��i��&�m^�4��b�b�������,b��������x���ܤt��jw�����,5+��Fd{��#�4�͕)�9[_�e�������hp��u����"+�E�Wi�("�T�����^��#}��+�e�@^���[�GK�+R���9�{&͕���0�?u�g����c<e��~�G��}���d ҧ� B��}g���-�۰��h4"��d�R�,�R� b%��S:7*��aR�p���@�jw"���!Y�"�������C�����(g���/�(���O�^"������fժ������R��M��OxD�!�OxB� ;T�]	�V�\0�^��N�P{a!pc�Z�E�#+ �X��h�:f�;o���O�H�V��V��k�K� �}_P�����ө��k?,�Q��u� Q�w��l��(�~��Ms�Pu������EE��2Tk�8*ڤġz�Ģ����j���}il�p��l,e�7��V���.�p'+𥼚t���T�7k�j��6J�+B�Q�]��Ta�d�ve�1���8�fW�L�!>���p�4H-WN�y�%Y�tG���J�������t�`��`��̿"|�7 G���9����8�o�����P"�H�-�"nK+,�&�tk*s���6���t���9/eES��g�%��g��K"�����M���e�>��5��B��;*��M�����V���p/���H�L��G��CX�>�2b]?L�!ֵ	]4L���L�Ja�@�
Z�ѹL��L�1kݚG�1��
FE�"J9�Q�W]�`����8�ކ��M[�R��MeyMK�˱JD�Vy�cĴ�؁Ċ�������Ǽ�e-�x���"��Ȼ{�bWOm�=TŞ�W���F�L�!넃K'�$�$^���V�K4���N�L��V�J6�!y%y%����w�W8����X���l�"q�.���t.���в%�G",T����B<<a�Nݶ�z9f��(���x��J��+��� "p�
�+	�
`�XI �'`�N%A���y_<�%pOy)�'��_�D42Fs	�Xd�}�%>�}</o�a:g���@�󐤴��l�0%f���.5�iOw'�����f�Ⱥ�t�����t?��#��"����;��r�B;��z����b��e\�έ��:�Nny�R��&�r/�T��8��MrR�v�J��_y���$�u      3      xڋ���� � �      J      xڋ���� � �      L      xڋ���� � �      >      xڋ���� � �      D      xڋ���� � �      @      xڋ���� � �      F      xڋ���� � �      B      xڋ���� � �      H      xڋ���� � �      �      xڋ���� � �      �   �  xڕUђ� }&sGT��˝�PM+���]��FE�jwf�����D8���Y��S�)�!^��5C	+����{t����l�V�U�4k̓Xv����W����������e�3z	�A%�-�7V>��}q�9�A}�P��r���;/u��c� ���U�*0�_���U�=}��[UJ?��ӟ��\�ޚ,�cv7
�V=��x~�:S-:��]=�/���T���_^�Z�1��h��(�	�o�ՀTN�8~)�t��&�o�t�2V��]�?qw	�=p��������>���=U�J��Dg�X��������i3�w��K�	]tW�U���R��@H�7�-�[�aOU=�7Ĺ'f��Hݧl�����ft�]�+?�~�f�Y���}��4f�xu����j5�&m�-k�i��T���S���
RqT���e�(\Y���v2�9kUC�M+��4S��
�ew�NQ;{�	�D|i�y����vV�o�l�H�2&CO���fg"�6�WY�e���jԼ�46A/�U�,.�H��_�0�#jm�i�._[{+`���U���bvG�n�l6!�K����4n KO=��ד�{v�5��2 �Y��I�� vnJ7+J7^}=t7M�f��r�l"���ʊ���9� [��2dJOO�� �?����      �      xڕ\�r㸒}VżO\���~�D0d�������.��O& � ��x#:�m��r9���b}<\�����՟J)���2�vP �R�_��K�+��/m�h�+�,���4G$ZT�Ep����k�g3�@�;ni�������}��^��j��1�wÎ8b�\�Z_��{߭����8�iD,�!c��!?�6*������)�V�_�����2cۼ�6�
���cA� 1�@\�.���cOo���a�D�XP��$�};�G��t�վ�އ~�9�PA�6N�)�_�*���52HԘuN��T V�����MШNAl7~Н?VOl�yf
��p�i�i@�1<�*����z��[�����ɪH�&H���N+�d9ф�)�������N\��.C�=�㵞�u:�W�wR�ݥ?u_�i?��l�I���?ݮ?l�o�X>:�<Y��l��W��%L0�ꃾØ��H:~]d���tv< w[c�V�;�����{�9d����ё��u8��$V���ě�y��A|Y��j7lV���l�?���nߟϫm/�*@�w��Ⴘ;/���Y[�ݑ��͂� :&(�Ҫ@mO���LZQ�L�������������t��� 9�|fq��谭,niq
�j7���NG-�IB�G�F�>���(lmc���׌V�Ȼ��h�C ��6\ޮ�������fn`�aן/�C?#F:���u��u��w,a���#�|�.���JN�&%A��>�<�)v�~��iC'�KL�G�����ƞ?�c�@"����b�#v�Y'c`�N z
�hwmA���=f�b`
�m��\ص���������P��i��)\��D�Oڬ�͉Kzk]觙��[T�6�=�?��~#Á1.��6T�����JFpB{���x�J�Q�M-	����o�*����pY%NL�}Zu����Ę�-,���>���Kk"Y$~��7.>���3���9����j�O;r��d ���յx{D݌��8��d,� �+�䴂��c�l�����"F��mp�Z���TߋhȋM��ֺ��1�0����#���Y]�O4��s��G%�z0�u:�X�\D���X��w��ix����QP�Q��:��GK�)x�8�@�~|��ҡ�&�;5�c���B�J>����uX��9���Q��K�H<��qw��& ���љQ�7Ҥ}��f�3���Ύ��=iU�`=�z7����m����ŉs�D�����ˇ�,)��ۅQ<��ɳ�'� �/te���RV��Ri���x�H����M:x�%���6�Oj7���p�_�yLr��`�.G%"h�%�uc��:6��7���y� �G���Ʒa9> HA�ho]���	�t �n�\��r��.�,FAL>�&4�׫���dAٜ���V�a�@��D���3Bl��ɉZ�&�>A5f��g����|���W&9������#��h)�!#4
J��}���}�{�ޓ�a|,Uh��h��{|��o��)u��	�9b�	��V�:
�3J6U�� mՍ� �Qd��m���c���x.�k@���$���x��������� �u<���'G�=k4TMdS��"�B�cN;c����r⳴�l�����(ԛIN��}	A/��L:���(ԛIYn�LD [�6�gl���l�D�e���}h�j�9�$z"#�QK��C$�$�}�gc柱q��ǉ5���9����$�y��d��=����qA���i6�BX�;?��6{���2����������@2��2���W���1�J�[ym��(�5�����(
;����m�J�5I���6:g2�p� `�"�s�N�va����	"���:���`z���p�l�F9����v��g�����A<�`Nt�j���2�Ù�}w9~J��@(�����U� ���l�7}9�FK1�%���)Ez�xO�B:fY�<�p�7U7�j�	��){z��+�zv;��D���x=\d��<�7Jl�Z��Ded�鋲ӺQec��(;�����]6���p�(�!0�@G�W59Z��2��E�6�n��p���H� e]U�.�<+!ewki_��cF����r�Ň
���I5,��GU�1V vVVJ �m>P���iޏ�%c9?��m��qb�e}�Ք.�e�e��;>���l&�Z��M�xH�"A�1p녶�rV<����-��v)g7F�[��f�D���c��kڍ�ww�&�[��jk;#�K�R���������Ui]�9dYK���E�Pm�l"�|D�U���8Tk��VL����˝�7��y
����da�EǱ�O[u�ɓ*&��60���!��W�W�3>�9ǚI��j3%i�<�,�>���󆣽��[����j��Y#��oz���b�-�GW*FǒQ)Rv��^ꐓ��h�c�Z����s�5 �c��j�E�qu���4����E�K��_ic�,O'^TՌ�*+w�2�+�Q��}�ui36�k�[��~���֏��L�K�U�c��ur
^�盈d�
gR��t��M���%�'І�6C�:Σ$O�3��	W����S��G�=�I�(�b�$l�KmC���$��P.D
[j�;�I�����)0M��S���>S}����t7�O�}>���ǋ�2�jf�o�?a:�Dy��`l,��b��*	ۿ���XW�q���{Ӂ*a@������zz�J,�v��C�� 0�:����%���$I3���݅J�O�K��H�cv�6.�WZ�ǬN�����xpDc�a:%f����^�ؑpC��W�������T�UV"�����L�j6��'u�<A�F�>�8��M�>��t����{�^���H5�Cw|{����s���P~�m�����(cY�����\��:cE,p��9+c�9f�Z�����BCu�E²�Ӥ����K��a�EJ�K�pA��j�5��9���m���+*k��[W�+�li���i�щ��,�	y�J{�J*�4G:�2"�y��UT���8jYb�t7ﺗ5~$S\�d�aQv\��7���<��ʝ�%�����VB�d�7(�I^sI0�E�:�߽��t��x$�S�M�$��a����1q�R��UDh2�4�*�x˓��Y�Q~f�f��禝j�9 �*�X�(%�=��y:`� ��2s��CW__3�(��"������>ؕ���������.�G,���1u� o*�[�r�G�#�G���41�2���[����m��|�ȍ��z����o���b�ZK�Vs���Y�+��m�\X��c�$�b{��8j�3xE�����X��fx�-��2���Ίk*L~�'ao��f����,�Y����	mM����w\��E)�Mn��8��<�.�G��ک[$U��z{�X?�ɸ�����Vð�l(�'�	�}!�!P�)1>�y�±6w&聏0���g5_����p�#���G��!�t��/�t����u?FoL� ����ݩ�-� �.��6ato����1��?����k�~���d����,������(R[���wy��f�5���� �X(�U��Xyy��Z'v�����V6uW7rΐ� b!�Ny����t���^�:���md�ў�
��ܰbB��_h�U窃Cy��n�3���a�[zYВdyv�p�.8�q��g\�mT������W�������mW9?nF�AY��Ӆ��n�Ӎ������\ҍn��<5�>��E �q���F7���xVnp����T��^����҉����dS �Z��Z�i�Q�O,;�yVh�Vkͫ�V�p���v���!��'Wk	"�{�v��}��W\�,fq��/}����U�Ź/�v^��9 8��\��v��ť���69�/����.���rS��y�C�)f���{�a����$9�\3e�r�����2��l0��~�����y~�rVt�f�n(P����!���&߷�!�K*JҔ e*
hi_E2� �  xf&>:咞m BC��y�L6��)��mp�4@B���#^�z��xS�'lj����@� T���+��'C�L>�����S�3"�r�
��T5�V��5O
����-��H���|5ٕy)��Q���P��$�0ߝŠʲ�nT5��F�Z��-3�Pu� �3���ɹ�j9�K��ݟ����|�U0�T=�q��W�zV�d����VM'�"9@"`F̆�L���N��@�}tHpN�����w]�2N��E���u�H/D%�fs���(j�x���dˣG�C7/������G���~��$C�ɏ��Vۗc�a�xL2�	k���t�
�>��U7�
�k�8�/���x]�28� y/����(�K�zf)0�]�;�����Cp �Iq(���Ƥ<j���"�=��d,�����M/e��>�?�'Z�&�S�e@O�\>)7���g:���\0��{?���jY��p�T�
�n��q�ۙD&G�_��H�י�Mv
��|�[��F�����+����^R�|ۮ�]�G�f
$����PCq�$l��u��q<~�xn�-Z9��oO�qv<��/٫F��W<����.X_���i�Z�~�!�`Y43����㱁xMI�B�+	~X��(H<XW�ŏ�Kv^W��c���n��L~R	ȋ�H�m9[2#?e�M��'g��l�~��C��~?\�2I'#���_�����xa      i      xڋ���� � �      M      xڋ���� � �      O      xڋ���� � �      Q      xڋ���� � �      S      xڋ���� � �      :      xڋ���� � �      <      xڋ���� � �      T      xڋ���� � �      V      xڋ���� � �      X      xڋ���� � �      8      xڋ���� � �            xڋ���� � �      /      xڋ���� � �            xڋ���� � �            xڋ���� � �      !      xڋ���� � �      #      xڋ���� � �         �  x�}�Kr%)E��*z�Q$�_�������R�5�����8��I����ע_��!���7�W����.��tJV�}2�$�bNr�ph= ��E�ԩē�mȑ��9>�G<E�-�9���G>C�$��JنC���\VB�-:y8�8�p�*���߂�k�R���I�I���#�����(傈�D�[vBR�4sF�8Y�������ͤ� ��,�ԩ�C�Ѧ�H��*�'�w���I�*5�n$6�tD��֓�Yk�T���<KQ�Q
D
Y�*��ѻL���5ѐ�N+�tvH�w�̌@�N��L#���a�;�Ӣћ��RN2ԻS�3H�i3�{/��N��v�AF�d�4�3H��-�\p�� vUbd��5p�:?�3JH��I�z��[e+�*;��*�n�A�n:;� �Ue9��ө�� ��\����%��$Hp�S��|�c� �5�܃�J��)o�ඒܾ;�c��v"HpcN<s��Q��$HpK�k�S�!����u���I	�1Ƨn�����I��*�"0�ҩ(������[��C�6��mՖA�N���En��* �R�}�U���Y�9$EAC�����X[���LF�U���A�;�i�΍��]u�n��v:����6�;���m�tdʷwI�&��<.�#�k�S��X��6�(3\�v:��������"��M85\��pebuڐT�X�]�UjW��*�;P�~u1���2���9�BR���QF���i�`@R�vIWG(��E@T�S
]��D�ݫ��6jV�&BU�e	Q�z^�l�*c+��Jg;h�	�<g�ZaU&�ݷC�sV���=7~z��&�?�٩�E͚1d������9�<���6��9�>��\6��I���Y1�4�\p?�t���ެC������E͊1��D�bR��6�!���Xp�tʗ4Ƒ��I��tNW�`�,��bpC�tjz�w\ ����L��o���\�IܪJ�ToԘ�H��--�'_��l��N�DW�ܨJ�mԈ�Ht�j�J��,>G��6UA�N�~��9ݔ�Y���4��s������TR͙�$z���K�NO��>CT�r�J����$���?4�ҷQ�T �=V�|�T�l=t�i�u�&U:�wz_�y����y0������XP��m�1
i[�E�)�E���Q�>�Cc�רY1�<��˸R?��]9y����N�jR�Q*��Ysgp�:��hz߳y�Χ0A�۽3R����U�qA3{����U��&=K�i�!R��W�'�v�O5� E;"�:���ދqB�-U��N�L��8��S�*���Z���I���F�"����NE���j}�@�N��p� �^6�8�C��P�ϧ,�ΖO�~{C�K����Nϙ�﷮e�U
fE���x�"�!��sD�;Z�x�����tq�Y����U�����z�Yy���u@�;���j2~/ܪJϥ�Y�*R~3/����q+��!d�� ��V�|�:k���J[a�:���k))D��Y���鵔��*�	'��3)�P!�u�
�y�t>[�]�`��~;�:�]��­��>�ԑ�U�;ޓ;�=��	1��I�g�Iϙ�/
�^�
<;==��u33(h��b�/	��jp�;�����|}~~�I~p      %      xڋ���� � �      Z      xڋ���� � �      1     xڕ�1K1��9�(8W.��%7JUpqpvz�Vڂ��}��S����چ�rĻ�������ݥ!�����~�ݹ��Ҟb��6�����|�<����:n��o���v����鼹����˶x��o�m�{���=���ۗ��]��C.��27�$�3ɪ3Yg�rH$�<�(�S"�,1�`b�4�ڜQ<�Dԁbh��(R[t��Eu�ZD1g�Hm�YEԉbh�ed�Hm�$#EԉbhŜ�"�E��\Q'��E4Kd�Hm�E"EԉbhŜ�"�E� ����3-K*�S-�����<�P��&,M'���	���:��J[,M�Afj�FlG�;��J[,M��S[4be�آ*m�4�FI���N�:��J[,M��S[4b;K�آ*m�4�Β�-�M�;��J[,M��S[4b�%wlQ��X�l�,���.�tlQ��X�l���h�B0�ҹ�*/X����bPb[7x$�[�ηN-��L�FB\�@㒕�ejR.W,�\"Qƍ�s�Y�\�&���\"Q�-�s�Y�\�&e|�^���E�^-l      ^   O  x�}�=nB1E��wH��ǿ�=i�,��G��fp�?�V>K��vy�>��g:��Ϟ/���L%�^��q����n�x���s��V����<\_{�a���>��-u\,�X4i�j�ŪE�U�i��7��U���4��i�m��Mu�h�m��T�8�h4�VhtS�8��hԭ��R8�8i�m�O�U�����;�z1orr�1)+�U(f�aYU�B1.ǆuYS�B��@̺��bc6�8�P�,3��Ν�bh�X�m�Z(����R��B1�@�du��u`o��[1�-{��w��s�3戽�����bo�{+M�{�����z#�M      �   F  x�}�Ok#G����S���o������^B�9���Æ`˰��hƚ�V��7�F����0�~�1az�>e���6?~9�8�����������|��r�C����/�ד���<�������v�~<�O�r闐��/}��χ���C��;��OS�ާO��-W}[�<�����w__�OS\�\��[����4���o��]�r�������Z�Ӈ<�q:���^�K��6�|��%����t��]i�4�p�p�z�r-��t����v��H��xDS�z$����<��&�����_Y������~��|��EL~X?���&_�(?��K��k�$�����*�����ɏK�w4?�����|/��x����G��C??��>����}2�i��4?��e��L~��k����'���O{~��T~�&?/�!����8���~���-?����~~V���g���/K~�/M~�Q~�͏��_����Ώ��_���H~�����5������Q~��O��_��	,�6���ϯ{~�$���,w�ҟ"�k�Ґ<�L w����̠�8%����2�V���Z��1���r�~��2�_������G��-�0s�U`*����@l,ԁh X�$X��)X,�Z�p��`bF���Al,��h<X��@X�EX����r�5a����Bl*�T�hXX	�\X��aX-��������0:�����(��ʈp��J��LD��"��0�TD���b��E4^��02B��hĪF����!���.��aP<"�� |D��`��$��!!�h	2Ƒ�.$Q��$KB&�4	a�Di�aA��1NJԛaQ	�J�.+�����]�ZB���Z�𖗲���RZ_��)��+Lq�0(1ŵ� ��7L����`�)�283�e&�Йb��Ѕ�l�D�ҔF���=fMA3�ξQ>�1X9���x�h����v����/��cd�G�{�t��n�9�c�9:�f�����]vʾ��ԝҸ��S<��<E���S��2��SZ{"�)�H]}ʦO$�O	�0�?%�a0���_���ߜ�b      �   O  x�u�;NAEѸ�6&G�OUu�@/������;5v�+��������P�c5�������s6n�Ak{;K;�Ϸ���}=oM�E��O���M0f1�XaB�e���P
�l��\�X��2@���}+�fX�����}+V,�ae�{�bw*V,qX�����]�K#������}+�������[��J�5�C4�k��k-�%��|=T��E�$�����5��I�)d�do�2hj�C��[�L�r�Py�A��HE{�H{��i�HQ{�T{��i�H]{�`{���c��-�J��(�	3�������[��?f�k�e�`��=T���(�+����m�����m      �   L  xڍ�ˊd7���O�}HaݥY�	��r!�����3�e�T8S�fh��W�����
<~=�������~����?��ǟN��&|���OS>�=BT���p���|�����Cí�qTU)9h~pxu92��
����.G9j<|�pd��rx"G�Ҏ|��Ff������aQ���羾` ��Q�xls���3Ghr�������I�X� �X�#�~!�iT��AO������A��B⠧Bf����@Ȁ�܋}HW@�=L*_@|SR��|�m
1�L�+�.&/Ǭ�i��Z.��Ѥ�@�ԅ)2�Aإ�E	Т���;��c*E죠c������9�b)��c6�{(��,"�kd�M�YD��Y������ew���;�,fg��X��]ǐ1D�Ƌ���[�x,���8Y]µpJ����x�})��"H���1NI2Ժ:�|��d�]P̨�Stg�����5	�쫸 ̈́��0�i�����a��d�������h��
k��A��H0x��ZLa�ݻ;wa+-��8��3��WRd����O���+�l��`K��`vM�N5�Kj��Y�[Gی�o��љ��qQs*��h�wG{6�Bee����	���0^<��,�G 2������؋ KWֿ��K�"�R�T��1�*��3��dc�(����O7f��ݻɷsUǥMh��+��z���̨o����־�ʊ]�:p�ʚQz��B+�R����Ǩ+����=6#�Z�1���֊�p=�d���+W�r��� E�^�b��9b�ճKɔ5���4�w1��)��%?=�_�O�/��gf�R4�+V�R/g�=�!dWN�DF/�>�h�ס`J��\?��/ɓS�,=N^I)�r%Y2z�Լ��c��y��X���Ĳ��#����I}������F��uF	 ��s��e^z��I}��%�]䉰m�%��t1s#n�up�=LZ S4�]]�v�]�e�Rĺ��$D�1� :�yUi w�X�˔��KQý��p�y�i#D�}�g˲���9*��2پ9�8t���!�F?��W�w7����0N�>˦�6%�]�}��E&��E��H���O}����q��X����� jn�����d�cȎmcJ�KS��?(�R�x�t)Bj�s:X{O�^��2s@��i�U)��t)���r�h�{���,=J�2�@(�m�)�$� e,�I�+�y�2Z�O�DW��Ef��cp�O�U��9��]7oQf� ������zM�k��d�J�B��k:\{�|�g���$z)t6̺�|�����P�bϯ6��$�B����lJ�<kT������w^s8���f�S+fJ�Nr�$cK��t��� ��q�fO�E7h���Q�w<�}s���{�|�=�ջP6vT_3�,B�w�嫐�R
��Tį�4�e!\�S��6��,;��)b��\��J����\�y�b�_��uRYz�����U�|�Z���
*_&��-����k�)��~��m�ź�t����	Ҵ�=��j�,�����I�\��pҪg9�r��Nw����f��,�+�'���e`-/���1��4�PB         �  x�U�˱T1�������"" �8���cMQ3�Z��۟�o��n������۾��c۷ϯt�7��ۉ_秷��Oo7N����~~��n���7~���n�o��������7�.��c�A<��u�����h4�%?�{u��	��N�cu�q�N�wt>��;;�m��N�}vB��^� ��:W'е:�nw:���N�ot:��:!��	q�N���x�N�gu\��^�@��z��l�gvB��	8f'�}vB<f'�svB�f'Ļ:��	��Ng�>�����.�1����oD�G���Ưv��A�qPlT���#�Ɓ�8�7��#z�w{�qĵq@l��A��=�8bn�#z�O{�qDo�G\��A�qPlT��#��_�-9�W��3{��:�Z:)�N��c��Z{��J���xx��^���|��/X����a y�Ⲡ�­K��u��zB�����	u���'���=�~r�����eG�=��A�;"�%{"�)�î�-��Eƈ�qY�w���9:�;�C8��	�`Y$��a�8\�M� �'AŃ�J	��R	l��Z	�W�Kf�C-�r�Ŀ����-�[�r�Pn�-B�E���9�?�y�u��-[<(����"�[�r�n�t��n��-�r��[�/�xPn�-B�E(�n�W��"�[�t��n��-�r��[�/�xPn�-@/����"�[�t��n��-�r��[�/�p0�-B�E(����"�[�t��n��-r�5>�o���[:�[�%�[�%�[��0��[�#��[O��n	�-�-���-���-�r�x�[�pKn��˅O�z��^/<���^0�z����C��1�2�|͐�=C.��4vK�n��n	��[�%�[��0��[�pK\n�d���%�[�%�[�%Xn	�-q�%���~����'�         9  x�m�;J@��x���t�;��@<���
ʂ�׷;����~J����H�\��z{,-��ߟ����S�հ�篏�2��a,�NKňK��bѲa�e��e�T�v�ĭ��ج�x@z��MOȊc��c�C��ql*<6Soh�c��c�A��ql�xl�9�
=I��@��R��q̐EK"s�9rh�ВԜCl��k�����zs��d�'�9���9��ItΡ:G�NFҝsϑ˓�����s���`$�9���?�I�3�����`&�9����ٝe'goΐ�ӆ����3\ܟv��?�П���N6-      �   �  xڽZ�r�V�|F}ާA�}񛼕�K��r�펎�DX @�T����B�X-ҚE$��9$��8y2D�����������_)���m��uW�l�)����x������߿�^�i禦��ɵ�eL㶙R9N�*�
F��)����Ϙ\iō��E詨�2G��6�LE��iy���ϔ��֙�]6�lO�������)L�B\�z�x�"DOl-L��XV'VKGLM8DF-����Ĵv�FΜ�I�������p(����9��U~(.Ǳ�4����里�TmӥGwajn��pIգ��qR5}��_�,�O��J�kZ|a��qR�J?$w]n0l��2�%��m�@)����BTP�r@�e;����(v.8��<md `�GIjF4�>P-��9��c�$���0E�g�Ԝէ�b{�x>�w}놹\bڸ.VqhnRW��m���a7�b{�V�U�i�w��?w�x�6�:�!�jE��>�e�9P��A!��4jE��F׌���Ei@(R� <$��D�\���5�Nxa�!�b�M��R%m!{
��B���:���W��J7�ua=�]���X��QF�8�Z2��?��m�m�K7LMhS٦�Ԗ��P�B?�r�g>s�ӰP�,5�`�Qi^���2��b��P �FNq�O��֊F�'�jc�V	[C�My�:%�iT
���];5UX��K-�d��uC��=]�|��w@W(6ǉ�'��}b�on��䋟SH��ޕ�M����6n\ۮ���S����Ժ~s���4j�HJN����9�d���Z�s�q!���a�/"ʩ�p��3��Q) ��(�)MZOjKb�^eI͍M+_S~6��l*����8fj��M��T����jx��QV�oY�>�z����� �j=��`3��&�%�D�߂��}漡	iU����hޕc��������=�\��r�=���ՅD����x�����I4����Jq'��)Qd ���s��H�:�B�8�O�'�Y��uv#�K��\���P\m� ؊?���GY�!���{Ox,^�=��㶅F(������DJ��M�OANl@�c�V%4�Z��HhP�~H�y �e;��j�� �<�E��V�ڇ`C��H�g-8��ˈ�3Lx�_ AJoj�$�gHQ�W�Ċc�zh@m������ߦ�N�\��T9�CN����r[�8\9��^p�u�+�P�'Z8]�d��y��{&v���a%�p��:)����Ebup�R{�s�w��{��ԙ脪�M�ΜF�Y3��3׭����}pm�l�mڠ���Y�K����q�ڮ�ɿ�^\�m浲C��]ml�2���(���#h��v̠L��+7`�u�ɲ��k���O����9����S�Q&��!��/<���G�$Ix�]�d��b.x�먕��'y��׉8�N�d�̆3Ȧh�3[�u�zp�u�7��s�%����<��}��?�..����=��w��B�	�޹,���u3&H�iub5��'YQ\�/�_��"B�c�jPZ�Z�C�I\d�*n��uL&8�h8�u�(��ٚ��D��B�R:�ZI�g��Q�q]��Lп�][��n��a|���-���ǫa#�U[\z,y�"]�~(ojWn����Kê�|�`_��!k
��b/��$�b'�oU�>3�l�0c�pj��f�����Q�΂�DE����#u��uf�:m��_��̖Q�g��.����x?a(�������B���Cz���
R�l��j]�}h�t�:qbZKvj�s��\��3z%�!�H�Y���
Mj�d����$jic�)j�`��K���� �����Yk�7Ct|�nz(_\�}��H�;��i�-�P�[B5'T����GV��f��ݾ�8�n���M��v$4��"�nz����>֡�\=���>*�s�b/5��+�!�ԱF�P��4\)�c�P'LB��j�Y�*����D�~<�'�p�0���y�𡃉F�9�&�ᮼ��[���Q��>�:dTG�wo�b�+'4�D['�X��i*���z�p��":z��A�&+�y
;ςf� %���D�I/O!����d�vA��V�X0HP�О3ƹ�������.Ar��:Xk��0�f$�T .�T@�����>>�	� �����.M��a��s�C�z'�/������~S޸��n�M9��O����$��y����^%�4ǜ�YO]������S��։����A8�����F��5$ 9�ڰ���2��t]����*���<�h�G����f���n t�` jz�� �ϱߤEqoS
�!1�q
��O^��&6�"�J)������R��>@��u^%�e5�'�D;/%s�֊G	Z�5̪�<�3��}<��M�>kj��L`q�F�I�'I��o���/�?c_�*�ˁ�º����������&��;�������������Y�A<3����N��G��f��Y�T[!-K$Z�1e��Ń�4�� %��X��?2xp��9e��3��p�W[p�<mY����J�!d�������9-�U��*��������p�`C����v�sׄ�y(1N�4K�U�e�Im˻~7��������5���;���(|�/��_km�bp��Hk���$.�e�vɠ��1�R�R� 5�N�:���R)��Q+]CV�s\h�Qû��B�3���8e��]5]��t_��x��W���������>���lX (�& zZ��!o�>�D�>
�Rmɬ�Fݷ�(&�-� ��sI	ͬ�j#ZS�#+SR�� ӽ��P�m���v?�a�4�}
��E���lC��r����>^ūC�Z����kZ|�u3b�C��,�o�f�����\Y����o��dԪS� ��K��%cG7�AsM�sU{e��$&��E�#!�Tk|
���Ul<E�F����g����Q6���l!}�oۥ��p��_��?t�;�'O���O�������	�������:��ҵ���C���|,��|��i|�%��S�䨠/w��9�HZ��b���{�f��}>�|o�p+���rʍx�:`In��X�&r��~��y��(/κ��df�fs���![�iUyY�y�܄r��.��.��.*��ZvQ�]T�]T�.��.�eU���o?���|���z�M?N��g�w�6�5e��鈴�	��g����v%����'����Mwx��7�ۆ����k{�V�����}�d�`�u����=��)˞\�~�nR{?��44�]�_�[�m{��v�
��ϗ�y8�<��mq��\�_U^�;2��i�G��E�$W�$���^���.[�8��6��[c)��)�Tv$��&O(7�WFB�Y��\ː=� �F�:3|A�~��	�X���wi�4h�x�!PmU������\'��������rB��ъS>Q���}=�|�h�o�t��e�����n�[�7���Oc�)?������l����ɍׇ������������l��<�'��� =CW����m� f`�(�pC�����pz<P� ��I�^ykI\�	��x�a�Y/}�)�ȓu�
�FJ�E�S�C����@��ط��y�3�nD��_U����o���X�<NC����66��|�ϮO o���4�����fV8�O�n��Kɐ����u�Xfm�G�J�HfS����5�Z�Ե�ܩ�7/�?V�^��?a��      +      xڋ���� � �         �  x��X�o�6~v�
�{��lO����K�&�Vt�@��`���F"U�����w�%��S;풢�<�>�������e��T�����H!ERƚ���6s�8�	S��S&$��_HH
T�ɘ��)�ωZ�Ih��	��H	�2��<6�1�2L�%���#�n�Т�V�Z�~@��Q.4��RT��Di��0����3�s�XHY��HS�	g$".s@��#�c��X����z�;QP!7s����KByB��s�"��`T3�������V�3�H\*-r��x~8��a��4����Qtr���G�Co:B�OO|ꍦad�$g��{)�����^�S�W�?%����[�2�K!s���;ؕ�j���e5��FƔ*a�W��rn�P�xWUSu�9���w���i����6�z�LH3�a�M��/F&dF�Wfgq&$8Ni� eKV�2�3�2^f�Z��x���u��de���`�Uz��<���d���a0>��6��y��`�O�G�hPz',C|2l�ؐ�_��§�t!8�@�z�u65d��Z�,���Y��B@-������幍��+Q��k���h'��J��;x�v�6���s���vmU#W�����߲���QZ��v��qK1�'�b�R�ڊSKq�^��{5;!r`����8f}{���]7W}{�B�{���_9�AOu��z:_?�<�ɾK"|�x:�/E^�T�;��!��[�?�^���Bk����M��{ww��$S���%��w�c��P��W�c�j#ۗ��ÙYz�"�;��,q���?�;pf��X5�U���J�-N�� �C9�ܖ�{3ҙ��/݅���S�	<Ȏ�?G�C���zL�&�_������y���{M���]��0��3ӝ`($�B:�Qշ<p���R)yQjz��VV�̱�0�$
��w����3�q�6?MS����z~�n�jD�u6���k@�$�1�l���(�4ԃ\$,]���?�d�
{z3�4��D3tp������Է葾]��,�����~�>ݛ?�u��Hi��p�$1x���7�YRkoR;�+5�b�<�p\�@�h_�izr��T����8��}��yK�&�Ɂ?�z���"�E�1�9
zo(���w��Z��Thz!����)�sCU�r�� �Y
y[���@^,��Y����Xg5ˁ�-���\���p���8�M�9�j�9��o@���(4�� i�4좡D$�"G�)�}MIV��ļaixǍC��90kJ�*2����
*���
,TŴT������V�)�XB	��y���h2�>�jF���j���v�f�jv�f�jv�f�jv�f�j~���7��ٱ��d5w�x���͛ì�N"<��f(����ϲ�;�#X̓o�j~_�fб���qw]d��|��~ttt�*u��         �  x�u�=��0F�Z�oLlY�*�0[$m�4K�vw���r�VG�y�i�ӯ������Lc��Ú��4FN?���#�t)í�Wڔ~�o�iJ��ۭ��X��ǿ�����L%]n�z;�����y�����z�Ş˱6�����r��\�q���=8���"�:�A�tE�[%Q�Tw��꤫s��:�⤺�A�tu.�['Q�Tw.1����5��I'՝꤫s��u�Iu�E�tu�QZ'Q�Tw2����q��Bki�Ne��ZŎ�D�7D���+b���s�"�����X\���)SML�Y\������&&w�%V3�x�U�T�;b3�x�U�T�;�%63�x�M�T�;b3�x�M�T�;�-v3�x�]�T�;b3�Y1�.��Nr��.�������Ң�,�;���}.����k6z�{���^�s�yuf��ޱ���uq;ǓZg6{�;��[,��E��V�F      d      xڋ���� � �      f      xڋ���� � �      `   O  x�}�=nB1E��wH��ǿ�=i�,��G��fp�?�V>K��vy�>��g:��Ϟ/���L%�^��q����n�x���s��V����<\_{�a���>��-u\,�X4i�j�ŪE�U�i��7��U���4��i�m��Mu�h�m��T�8�h4�VhtS�8��hԭ��R8�8i�m�O�U�����;�z1orr�1)+�U(f�aYU�B1.ǆuYS�B��@̺��bc6�8�P�,3��Ν�bh�X�m�Z(����R��B1�@�du��u`o��[1�-{��w��s�3戽�����bo�{+M�{�����z#�M      	   �  x�}�Kk�@Fף_a��Es�,��t�u7��K���2����k��؅�����5?�wc�Ѽ�>A�>�|�;0�������eG��O;�O�o��r�9�s�}��ϗ�u��ի��|�r;�N���a����yƛ�y���~��g�e&��0n^Oǳ	��l��܌4lߦ�.b���H�8kİ&.1,Ķ����Z��ff+kvڪ�ݚڲ�]�M;�MU��-��[��	6k�/� ����@m��?-�T�a���аE�aS۱b˶#�VmG��ڎ�m�glGm��ɶ�����۱�S�m'�Mm�-��[��	6k;/�^����=�]fl/�.۫��b��K�m�MmO�Ι[�=�@����>�[j#��{��mmdP"�+�L�N>��RʩD���Zˠxǽ�wR��{o͌�w��x�Ռ�w�ͨ{'݌���({G匌��Ψx�팺w��{o�L�w���x��L�wФ{'M����${GM��Ѥx�M�w���{oͲw��x�%͊w�Ҭ{'-ͼ��,{G5͌��Ӭx�=ͺw��{oE-�w���x�M-�wբ{'U-����"{G]-��]-��]-� "]-�$��HE(���桖���z�i���H[m���x �>X� �~�?��V�� �����*Uf�j�2o�L�i
�m��S�딟��ا�@�P��
����TX�T}�ݩ�P��Z+OU@�����Ot��      b   O  x�}�=nB1E��wH��ǿ�=i�,��G��fp�?�V>K��vy�>��g:��Ϟ/���L%�^��q����n�x���s��V����<\_{�a���>��-u\,�X4i�j�ŪE�U�i��7��U���4��i�m��Mu�h�m��T�8�h4�VhtS�8��hԭ��R8�8i�m�O�U�����;�z1orr�1)+�U(f�aYU�B1.ǆuYS�B��@̺��bc6�8�P�,3��Ν�bh�X�m�Z(����R��B1�@�du��u`o��[1�-{��w��s�3戽�����bo�{+M�{�����z#�M         �  xڅ�=o�0@g�WȜ�w��4�d�%h�6�S8F���*�I���q�x� ���@=��*Put��U==�?���Ä������k����r�0��x�����Wf�V/c�ǻrx��r������?+���?���m�����ar���q��:��]�����������������򗑴�}�_F���y
#^#͈�1I��1�@����L	�b��i��`iPS@�I��'�RC����Ȓ��4Q�6?��&��A"�)��nIѐ�6��eI�E�2��I]%��I����$u��h�ԭIP��Jj��"�E�#5#�-��m�)�#ߐ�>
��R����Boݑ���F
���F
kRK)^I-c�XH�h�ؓ��	R�H���F�)i�t%u��R!u��RG�FFJī�6Rʤ�7RZ�:�H�{��(i(�����v$�|놖��<�Ӂ��<����� '���F��+��$?�$"�<SJ5��Vjbɓv��K���`򢟠O�0�hCA���+
�j
�� gS`$���h)��)�4D9�SP�)𢂦�i*��UA��(�
�|�#Y�O��������)�H�*'T�|U*ʾ�#*}ETTd|U2*	�j:*Ѿ�!�8_ՒJ����JC_-�_��J����J��rN%�W���쫰��
�H*Ќ�JT���dh�Y9�@sҪiZ�V�P�)j�[�R�-5m�Y ��jf���C`(�D}�3�*� ��- �_�5#0�+j�`�7�#����i����^b�D i1���hkv�þ� G"C"� i�!Tj^e-5���B�-�pE-�6+3�XQ++�����[�nmE����06���ʈ6���ʌl�����6ú�2�Ͱ]a�fh˺���+��;�)������{�4M����c      h      xڋ���� � �      k      xڋ���� � �      '      xڋ���� � �      m      xڋ���� � �      -      x���[s�6 �g�W`�K ����m7�l�4��i��/4K�)R%)9ޝ��=�ċ"����Ix��2���H p� ���\�S���(�a��y;�����/����׀(&����	"�K&_R2�����?�*�]�|]%�P�G��/)*�	��	��ĪVaW��Sk0�K����RiW��[)!���`�V�*�Z��Z���j��Wծ�}�^��VLª�ŀ�u�Ĳb��b�b�Ȫb9 t]1����X*�cA���ط���[1�_U���kf�5��5T�������F,?j$�[3�d��Y2���:*_��+�S=����ĳ��A�%��G/�pj^yq=��i\�yXfy��/��V0�k��w��]��zE�_=Bw�$��0k�����H���E2������������J_�#F���xV�Yj���yh�@e��#��,.5*�p��/ tw�I_(��|@�۟%g������v��-3�9fr'mWQ�4N�F�6+�l�%q�4�Ge���Ƕ[ؔ�Z�vy����o���~N�n�q�����k]�[8�{4�7�c�:}��u�*J��U �ȑN
���8U��H�I��i�8��IAT~~����k��<Lv�|�s���P�n_9�C8������s
"��NJ�=�y'hңG'9wNɹ���o� 8�C8A����������8�N�v[�]����W9��0y�<^���eD�|�w9���6��6����9g;H��;#(�����sIEP�_�(r`�`�ŏa���$�e`v����.y��Wp�`JR�W�e��p`�G9��FN�����[E�:�X����ݲh7�_���2��=
��4��Y��T�"�k�څ�ua�����d�ֿ�[�e%%z���8Y��(�Gh��a�0�4T������2g��٠�!��5[��Y��?�A���I{�$LS���x>{�ݞtd�:�|�p��	�n�}r�W���۟ow��בN����2D�$�C����I2D7��H��1T
W0N���ڼ˘rIX�}�ˋ�3�<c �}űYƒY=���� �3�<c ���[���e�*�i��U3���~9Z~����V\����.#��BG��hA�=n�e���\E��ը��}�,���G힙�g����,g_:���.ԍ��f�֥����7�1��h!�F�?�^��".�Fa�h��������o�k���8r<)HM�,t��|��,{�9�df1�#=Do��¨���#*"���.Ϧ]�f��ª��t�����ѻg省�²�1e9X�?�_���/�QQ?�e��0���G0�8���z�,�۫��_6��fݭ4�|�l��sϟ��7���!m}��eo�I����ş�x��� �n�?��:��M>Β0N�8���b����4���|�r]d�<�|��B���`,'�8�nK��ǏKrΖQM3@X6d�e�%P���%=gK����z�,g�8�nK~����R�3���ڜ�����Gz�k%>gKň�UP����,�-���}~Ɣ!�[8��8�NHp졿��ْQ/p��r��Yv[���;�)�@�jg��v�q����J�A�M)�)�/0�]��� xwy��Q�h6�
�q|��j���h���Ž����~���:����)�i����Tf��،0�(^ĝ�,	HP�n���(��	���"�?<�����/|�I��<�cD?`X���͵.��qd�����?�@U�a�vdk2�G��=c�'�&|^� ����F�W=��y�I)X�V�Ī����d F�E�g�&�O�դ�s�V���{{F8ON�Qo>$�qa�V���{{f�������&,�:�J��^�ٽRSm���M!n&a�$����Y��0>�*��eAo��7�������$13{Q���|���lu�(J�B�?��ؕ@��i��45m.LEu��y��|��_)<h'O���۞���9��e6]��:�F�$���<�M��ٕ#��{���xU����o���ϻ2b\��Y�̀���5�ud����l3�&���$����*`�Zت���IL��E'=dG�S�C��`�t�[�9��������=#Ug@IcU�E���� ; �����\%}%�f��[���+��V2��lt۩��!$���l�0��l��F��<AP�"p��P\��^���O=޵U��-Ƞp4���8���6R4�ga^�O?D��Gc]��8���H/⑆���%�q^_3�]�:V{V������ �!������aۥ���9�F����bl��Y��]?޹ڻV�˵6�\.n������sh�,�%n���JZ'�#�vY��}�����3�gV�9�*Ai�@+�iߎ�9� Kz��K���
Z7 ��Q�s�w5�t�d?5���D����Ɩ`�&�Y7y���Q�<s#'Ӳ��*Pe��>\��v��c8I8OP�E�.;QT�����6�e��K��_;��:�<����^���}D	��Ih q�O v�Q.��p�>bD|�&�0��p,��\�pP����(fO�:H��3�� 1"��^�Wo"(nZ%���%x�~Z��W�"����'�z��"H�H/m�}#�_
Ô�z��Zr_�����z����8TY%�����xjl`;�9}��*{>?����E�,@�Ȓ�rGf��g���4Z����z˲�7�&���6ʟh��U��Z����O���:��0���c��rj�őFpR&Su8��qn���A@LJy�k��}������A+��J���WG�vQ�3�25���HU��s������6�@-@�'�#J���$���|���iO�)��Q~���_�Aj�Pށڀ�'Ã���T��m�ʃ�"�}�ig[�f�G���0D�i����X�Bsc���W�6
{߿��{\�!�r���݅@�e4Y�<D7�8�f��Y��mlvFw�$1����Q���Ig�3%H��0�����lh�L{�i|���ru�Yw��gCg6h�'<�ha;K:}�n{j���s����`����r;G��h5J��ޱ����o�G�g�-�d��]�LQ~�2L��Lrf�/��Z��1���q���Q&�z��ka���!��O�J���S����V�N�#���y8	-�:%	l3c\����}D?Y,I��� ��Re�X/�+v�Z�C�+��l/��P�^"��#A�΂���v��me�zi��[�u
Z�4P��nTZ）����"_��~4�&M�EX��Z�:γ��!�7��dk5j]�{E�M>��S,����'%J��@wy���Ȧz���L�h�%��i=��� ���T������'N�.�A��,1���fN��3p�����b'�j����n�N��3p�����b'�\�r�ނ�k���#��Y��!Ƅ��Rg����l�&�O�d�!�tۙi��-fس�=����ʛA�j�
|��f:Ea���#��r�2�8�ꑙC��!����_n��@�!��M�?�ef�?�qt�L�S�q���6D��2�����B'w��ea4���y�n��.v@��3I��V?:�/�n��a��z�sޜKR�yL~o��gN�0m����ny����$ص7�A�F���������4����a�FZ��"��M	��iv+ۑ	�}�6`K�Gt�K�\����|���6ҽ�$�%s3��1\�v��A�Fz�M�e�}!�N�˃z�����l��0���l��cQ����q�n8Ϛ��|���ު����_	Kw�����D:.':G�,��ؼPv��C�
.��I#o7���VQ���2u�d��f�Vi�~�q-#L�rc�nf�E�{GR��Qqb�(3i��e���#���][�q-#��rçn&����^j��VQ�O����Ì�&ʬ��9�U�����NF�jf5)�g1�ka���婓�\������7� �(�P��0�ٺ��n�=k+�=�>����FG�\�P���Җ)���nuM�p�m�bU��(��E��ooo^�t����|^�$���l�� �   �����޼j�'�i8�]����N��{G�Ei$i�q����'����b���α��0��b��C�ӝ�"�N�A�m�?g����>"Q�"�>��@V-E����>�P��`����yq~;���@����v>���2���l$ܹ1;7�)���)6����Px�������n��^�jT��|I�32�Yv��ƣ���i6j��vi��������S�,�      q      xڋ���� � �      o      xڋ���� � �      )      xڋ���� � �      �   �  x�͘MK�@�ϛ�b�;�i��PQ�R� Hh6�65�V����7��<��9���L2o!OV�˼.���]�ۮW��}[���u�.��M�_}֯����/"u��e�z:�?{�<G뢭k�x����w��6/����a��x���as��C�P���y��p��DVP 
�bN M2!P�	dC���@6J9��H�%�C"�9�&�$�Db�!A$IdH���)"Ib��XpHIRDb�!�!|c%�!LTD���A�9@��y I���bABC H%4�X�А��	� ( F(`�
��
���2aD�6ax��NQ��O( F(`�
�QXI� �e��`V(Fay��q����e��`�/P�j�}Cx&�=&|���������_�o��mS����e�����e]V��m�𯍏C�c5s[W�kש�X��I�,�M�՝�V�0o�U����d֋���<��O���.      �   �  xڕ�iO"��?W�
�F��<tr�#��ؠ"*���=B�P��.ě�>x��h���y�X�&S;���g>0����JO�}2jV'q�锺S��pq��⋖���c�^'��Q�G�ME�>�l�?v�J~���,�a�����d}s��8O��S���L�p�YE>I#CL�$I"��#�0���wה�2����Zz}���g�����H%����u�D-�TX�a��������9/�ۛi��,J���]����^�񧡞�F��x6�>���{�8�{��\�q�� �k�\�efrP7�l�k%'4~�ˉ�b?��^E�X�������	,eTA��p�n��9U�/x��Kg�J3��򹨞Ҟ�]E��QU��b18��:���+��}���Ë9 _��[r(��V+f�PrJ,8�9�,fNFO����[�;�A�Q��\m�vᆡ8X�`���11)�aAzO��?n���rؠ�����C##�.��(ũN|S�Q��g"����P�8�Y���.שּ�9���Io����(����I�KL.��g��'�N��+��2(�5�,T�ԓ$k���b��G�R.���j�8bF�H�7�q��zߦ\�YQ_��PE� n�Z�T�&E��"0�E�smq��R�Vi��%"D����ISN{"��0T�M��Q5�
�*o��)���D�)�%��X�K�r�4�:d��S,�@Yß���T���@l|JES����D2ϭ@Y��Q��'[#��ҀW�SA���zj�
�H%$�r�V��@�

�*+8D6� 7jS+�?�����9:C�1!��xI<C:rHy�ȟݵ�< EQ�O�"��R��/��F�ֆI�ނ^��Fz.6��;�
�W�S��ާ����R� 	��DE�k��VD��l���M�V��Kܥ/��oz?&�K�'-6��n�a�0��+Z.��>L�l��N��bp ����H+�?�&k���=v��~���͋�)�Y�Q�?�+t��|,1^����ܿ�pI���x�)�,0K=$(#se@�O�bE-v7�����{�vm�+�B���v[o��e���o��,�]����� a��{B'ym6���nU�|66g�|fɡ�&�wwfv㽝Z��
��jVu�JJ�N6=,w���5s�v}*��Q�n��R<w�8wd��l�|��,�Z�b1��~]�d�J�+Y�m֋|�_]�Q�40�x�!��h͈!���jN��Pz�g�(�	h�*�&��+�0O^�ƭN�NqlKy{G��4�����j�>u��i N������,]�m��Q�nl(�y�`f_�B��7b���$Z1��!�y	�5d�ݸ_E�����I���e��?մ�W���Y��>������u�9t���5rݛ�dǊAp_����ޱ�R��P��A+�������nسe�i�lT��Uj��o��j�_��Z�'�K�~�|i�鵿zx��{;�7`��n�^�"�~䓢����̨���``����Q��1&����F�S�`"-�[�x7��o�R�<�a���.��:_Ի��'U۪�z��������R�������W�bm��o!��,�p}(��T���$4��Ḛ?9�AjO@zx(�;��t���U+8�f���4��~�q�T���W��뫋Fp�G,��*���C�T�o�*��_�#Vs(W�_m�u_�/UZ�I����;�	!,0��U
|+�Z����y��۷��<u      s   `  xڝTMK1<��#����=��"Z?A(�n����5I���7m����;�f����jVz��3�u�2yx���V�d�����V�i&+��*��0b�!"S@̬R��o���J����&D�R"3��ٺ3�4�}��>�ȉ2)Df%���j�;on�ݦz
���/�V�Dj(�Kw\W��8�ؘ(SR3�`�z]/����g9��pFB@jNP L.��:M~�e��.d��K�T�L@ s�nc�������ՍCf=��!���f3	�q��,�Y��<x>m�؄L{2�[0AQ"g+e�������o⇐UO��� �A��w�p�𢫻!��Jm��v	 ?�O�      u      xڋ���� � �            xڋ���� � �            xڋ���� � �      w      xڋ���� � �      y      xڋ���� � �      {      xڋ���� � �      }      xڋ���� � �            xڋ���� � �      5      xڋ���� � �      7      xڋ���� � �      \   �  x�}�Ks�6��Чཱི�/��U��N�I'u�N/ 	I��PP����[��F����}�u��"�Z8�BM����EY���i)�l �,������'��<p)x�C�wn��o"���/.�R?04"ەG���WeQ�^�x���)����L��H��`a?����|ԄY\�~�؅�~8�+�h�kUh����EvP���Fj.i�P�R;���v�mo]Nb��Ł]�N8ØKi�QԠ�Vf��Y��Т������lʇh��}�i솮=ZHi�Kҫ�dm����������⨦l�;5c�1L��J_�$���7�A�Ɍ16)�L����p���i��jy
��Bw
���~��-%q���:��+Fĩ)��X�5�ũ�:W{.�@`$08�C�khuϒس�G�M��q��m#+G�6�zsT�W3���`�?>�����ű]@���W	U*9�����
��o�֏O��'^��V��v⨋��r,�B;[��D�;ꢺNL߼��-�gq��HGzE�$����I,��9�!P�
f���$��ƀ��^�v5��1u?���8�%/�`бE�}�����71{cj"��&��8�D�ya�AʳC���t�������vpm��_��Β$�R?��Cډ�L���M��t��E��4I��tF0"ȷ�<�����.��^0H������:�,޶���TL�z����oiX憌�v!H;��#�ED*���Y�xW�uh^��g��	������e�2�o��085�cs�b�Z��
�s�T�X�f=�/�?��,K�Q�Q� �^/ 01��d�Y渾9���j���˅��ʳ���
�z�o�
��nA!���������	:��į���������a4����Ф�2X��$s	~�4��\%�2K���V#����#̬MH؇zG� D�<J6]�Mz
B��`:�����e���o�8Nb����F�K����j�Fp<      �   m  x�-�۱� C��b������q-��,�%�O�-�����m61k����ز���~�v�8��q�_����	/��$<�n��z�S<->���x�+��iPk,���yi\kħ���Et VԮ��`Qa1��h1OQV�͛�������Pvdx]��i�1h&����v	�i�@t]�����Qe��)�	&��V�!ȪN����0���-����K٤�);Nq�ec��lV�Y�_�o���~#O�7���Pz�����bG���)o��N�H�c�QR��@��.�f���Y%���Ǉ���Ri��J�[{�N6�ޛ��R�]$�y���Q�ϒ�9܇��f~r%������m�     