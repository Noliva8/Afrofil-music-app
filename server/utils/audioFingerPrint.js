import { exec } from 'child_process';

function getFingerprint(filePath) {
    return new Promise((resolve, reject) => {
        exec(`fpcalc -json "${filePath}"`, (error, stdout, stderr) => {
            if (error) {
                reject(`Error generating fingerprint: ${stderr}`);
                return;
            }
            try {
                const result = JSON.parse(stdout);
                resolve(result);
            } catch (parseError) {
                reject('Failed to parse fpcalc output');
            }
        });
    });
}

