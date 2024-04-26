import resolve from 'rollup-plugin-node-resolve';
import serve from 'rollup-plugin-serve';
import copy from 'rollup-plugin-copy';

const dev = process.env.ROLLUP_WATCH;

const serveopts = {
  contentBase: ['./dist'],
  host: '0.0.0.0',
  port: 5000,
  allowCrossOrigin: true,
  headers: {
    'Access-Control-Allow-Origin': '*',
  },
};

export default {
  input: 'src/main.js',
  output: {
    file: 'dist/weather-chart-cardx.js',
    format: 'cjs',
    name: 'WeatherChartCardx',
    sourcemap: dev ? true : false,
  },
  plugins: [
    resolve(),
    dev && serve(serveopts),
    copy({
      targets: [
        { src: 'src/icons/*', dest: 'dist/icons' },
        { src: 'src/icons2/*', dest: 'dist/icons2' }
      ]
    })
  ],
};
