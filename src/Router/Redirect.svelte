<script>
  import { createRedirect, getDepth } from './utils/register.js';
  import { getBasePath } from './utils/basePath.js';

  export let exact = false;
  export let from = '*';
  export let to;

  const basePath = getBasePath();
  const depth = getDepth();

  if (basePath && from === '*') {
    from = basePath;
  } else if (from === '*') {
    from = '*';
  }

  createRedirect({
    from,
    to: getBasePath() + to,
    exact,
    depth,
  });
</script>
