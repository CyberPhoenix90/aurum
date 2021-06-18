import { DataSource } from 'aurumjs';

export const currentScene: DataSource<string> = new DataSource(new URL(location.href).searchParams.get('scene'));
export const backgroundMusic: DataSource<string> = new DataSource();
