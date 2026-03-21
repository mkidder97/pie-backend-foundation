DELETE FROM pie_episodes
WHERE source_type = 'rss'
AND raw_transcript IS NULL
AND status = 'pending';