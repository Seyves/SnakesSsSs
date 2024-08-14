CREATE TABLE author (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid (),
  ip inet NOT NULL UNIQUE
);

CREATE TABLE post (
  id serial PRIMARY KEY,
  author uuid REFERENCES author (id) NOT NULL,
  created_at timestamptz DEFAULT now () NOT NULL,
  content text NOT NULL
);

CREATE TABLE post_like (
  author uuid REFERENCES author (id) NOT NULL,
  post integer REFERENCES post (id) ON DELETE CASCADE NOT NULL,
  PRIMARY KEY (author, post)
);

CREATE TABLE comment (
  id serial PRIMARY KEY,
  post integer REFERENCES post (id) ON DELETE CASCADE NOT NULL,
  author uuid REFERENCES author (id) NOT NULL,
  reply integer REFERENCES comment (id),
  content text NOT NULL,
  created_at timestamptz DEFAULT now () NOT NULL
);

CREATE INDEX idx_comment_post ON comment (post);

CREATE TABLE comment_like (
  author uuid REFERENCES author (id) NOT NULL,
  comment integer REFERENCES comment (id) ON DELETE CASCADE NOT NULL,
  PRIMARY KEY (author, comment)
);
