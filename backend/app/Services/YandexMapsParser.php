<?php

namespace App\Services;

use Illuminate\Support\Facades\File;
use IntlDateFormatter;
use RuntimeException;
use Symfony\Component\Process\Process;

class YandexMapsParser
{
    private function normalizeDate(string $date): string
    {
        if (mb_strtolower($date) === 'сегодня') {
            return now()->startOfDay()->format('Y-m-d H:i:s');
        }

        if (mb_strtolower($date) === 'вчера') {
            return now()->subDay()->startOfDay()->format('Y-m-d H:i:s');
        }

        $normalizedDate = preg_match('/^\d{1,2}\s+\p{L}+$/u', $date)
            ? $date.' '.now()->year
            : $date;

        $formatter = new IntlDateFormatter(
            'ru_RU',
            IntlDateFormatter::NONE,
            IntlDateFormatter::NONE,
            null,
            null,
            'd MMMM yyyy'
        );

        $timestamp = $formatter->parse($normalizedDate);

        if ($timestamp === false) {
            throw new RuntimeException("Не удалось преобразовать дату отзыва: {$date}");
        }

        return date('Y-m-d H:i:s', $timestamp);
    }

    public function parse(string $url): array

    {
        $temporaryDirectory = storage_path('app/playwright');
        File::ensureDirectoryExists($temporaryDirectory);

        $yandexIps = gethostbynamel('yandex.ru');

        if ($yandexIps === false || $yandexIps === []) {
            throw new RuntimeException('Не удалось определить IP Яндекса.');
        }

        $env = array_merge($_SERVER, $_ENV, [
            'SystemRoot' => getenv('SystemRoot') ?: 'C:\\Windows',
            'WINDIR' => getenv('WINDIR') ?: 'C:\\Windows',
            'TEMP' => $temporaryDirectory,
            'TMP' => $temporaryDirectory,
            'TMPDIR' => $temporaryDirectory,
            'PATH' => getenv('PATH'),
            'PLAYWRIGHT_SERVER_MODE' => env('PLAYWRIGHT_SERVER_MODE', 'false'),
        ]);


        $process = new Process(
            [
                'node',
                base_path('scripts/yandex-maps-parser.mjs'),
                $url,
                $yandexIps[0],
            ],
            base_path(),
            $env
        );

        $process->setTimeout(300);

        $process->run();
        
        if (! $process->isSuccessful()) {
            throw new RuntimeException($process->getErrorOutput());
        }

        $output = $process->getOutput();

        if ($output === '') {
            throw new RuntimeException('Парсер Яндекс Карт вернул пустой ответ.');
        }

        $data = json_decode($output, true);

        if (! is_array($data)) {
            throw new RuntimeException('Парсер Яндекс Карт вернул некорректный JSON.');
        }

        $data['reviews'] = array_map(function (array $review): array {
            $review['review_date'] = $this->normalizeDate($review['review_date']);

            return $review;
        }, $data['reviews'] ?? []);

        return $data;
    }
}
