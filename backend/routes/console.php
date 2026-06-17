<?php

use Illuminate\Support\Facades\Schedule;

Schedule::command('organizations:refresh')->twiceDaily();
